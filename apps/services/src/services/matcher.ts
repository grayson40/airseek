import { ScrapedProduct } from '../types';
import { supabase } from '../db/supabase';
import { ProductCategories, ProductTypes, ProductPlatforms } from '../types';

export class ProductMatcher {
    /**
     * Match a product to an existing one in the database or create a new one
     */
    async matchProduct(scrapedProduct: ScrapedProduct) {
        // Normalize product data
        const normalizedName = this.normalizeName(scrapedProduct.name);
        const normalizedBrand = this.normalizeBrand(scrapedProduct.brand);

        // Generate potential matches 
        const potentialMatches = await this.findPotentialMatches(normalizedName, normalizedBrand);
        
        if (potentialMatches.length === 0) {
            // No matches found, create new product
            return await this.createNewProduct(scrapedProduct);
        }
        
        // Calculate confidence scores for all potential matches
        const scoredMatches = await this.calculateMatchScores(potentialMatches, scrapedProduct);
        
        // Find best match with confidence threshold
        const bestMatch = this.findBestMatch(scoredMatches);
        
        if (bestMatch) {
            // Record the match confidence
            await this.recordMatchConfidence(bestMatch.id, scrapedProduct, bestMatch.confidence);
            return bestMatch.id;
        } else {
            // No match found with sufficient confidence, create new product
            return await this.createNewProduct(scrapedProduct);
        }
    }

    /**
     * Find potential product matches in the database
     */
    private async findPotentialMatches(normalizedName: string, normalizedBrand: string) {
        // Split the name into significant words (3+ chars)
        const nameWords = normalizedName
            .split(/\s+/)
            .filter(word => word.length >= 3);
        
        // Create search conditions using the most significant words
        const searchWords = nameWords.slice(0, 3).join(' ');
        
        // Try to find matches first by brand + keywords, then just by keywords
        let { data: matches } = await supabase
            .from('products')
            .select('*')
            .ilike('brand', `%${normalizedBrand}%`)
            .ilike('name', `%${searchWords}%`);
            
        if (!matches || matches.length === 0) {
            // Try a more lenient search with just keywords
            const { data: keywordMatches } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${searchWords}%`);
                
            matches = keywordMatches || [];
        }
        
        return matches || [];
    }

    /**
     * Calculate confidence scores for all potential matches
     */
    private async calculateMatchScores(potentialMatches: any[], scrapedProduct: ScrapedProduct) {
        const scoredMatches = [];
        
        for (const match of potentialMatches) {
            // Calculate name similarity score (0-1)
            const nameSimilarity = this.calculateStringSimilarity(
                this.normalizeName(match.name), 
                this.normalizeName(scrapedProduct.name)
            );
            
            // Calculate brand similarity score (0-1)
            const brandSimilarity = this.calculateStringSimilarity(
                this.normalizeBrand(match.brand), 
                this.normalizeBrand(scrapedProduct.brand)
            );
            
            // Calculate category/type score (0-1)
            const categorySimilarity = match.category === this.detectCategory(scrapedProduct.name) ? 1 : 0;
            const typeSimilarity = match.type === this.detectType(scrapedProduct.name) ? 1 : 0;
            
            // Weighted confidence score calculation
            const confidence = (
                (nameSimilarity * 0.6) +  // Name is most important
                (brandSimilarity * 0.25) + // Brand is next most important
                (categorySimilarity * 0.1) + // Category adds some confidence
                (typeSimilarity * 0.05)  // Type adds a small amount
            );
            
            scoredMatches.push({
                ...match,
                confidence
            });
        }
        
        return scoredMatches;
    }

    /**
     * Find the best match that meets the confidence threshold
     */
    private findBestMatch(scoredMatches: any[], threshold: number = 0.75) {
        if (scoredMatches.length === 0) return null;
        
        // Sort by confidence score descending
        scoredMatches.sort((a, b) => b.confidence - a.confidence);
        
        // Return the best match if it meets the threshold
        if (scoredMatches[0].confidence >= threshold) {
            return scoredMatches[0];
        }
        
        // Flag for review if it's close to threshold
        if (scoredMatches[0].confidence >= threshold - 0.15) {
            // Flag this match for human review
            this.flagForReview(scoredMatches[0].id);
            return scoredMatches[0];
        }
        
        return null;
    }

    /**
     * Create a new product in the database
     */
    private async createNewProduct(scrapedProduct: ScrapedProduct) {
        const category = this.detectCategory(scrapedProduct.name);
        const type = this.detectType(scrapedProduct.name);
        const platform = this.detectPlatform(scrapedProduct.name);
        
        const { data: newProduct } = await supabase
            .from('products')
            .insert({
                name: scrapedProduct.name,
                brand: scrapedProduct.brand,
                category,
                type,
                platform,
                image_url: scrapedProduct.imageUrl || '',
            })
            .select()
            .single();

        return newProduct.id;
    }

    /**
     * Record match confidence for analytics and review
     */
    private async recordMatchConfidence(productId: number, product: ScrapedProduct, confidence: number) {
        const requiresReview = confidence < 0.85; // Flag for review if under 85% confidence
        
        await supabase
            .from('product_matches')
            .upsert({
                source_store: product.storeId,
                source_identifier: product.url,
                matched_product_id: productId,
                confidence_score: confidence,
                requires_review: requiresReview
            }, {
                onConflict: 'source_store,source_identifier'
            });
            
        return requiresReview;
    }

    /**
     * Flag a match for human review
     */
    private async flagForReview(productId: number) {
        // This could notify a human reviewer or update a flag in the database
        console.log(`Product ${productId} flagged for review - possible duplicate or incorrect match`);
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        if (!str1 && !str2) return 1; // Both empty = match
        if (!str1 || !str2) return 0; // One empty = no match
        
        // Calculate Levenshtein distance
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
        
        for (let i = 0; i <= len1; i++) {
            matrix[i][0] = i;
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost  // substitution
                );
            }
        }
        
        // Calculate similarity as 1 - normalized distance
        const maxLen = Math.max(len1, len2);
        if (maxLen === 0) return 1; // Both empty strings
        
        return 1 - (matrix[len1][len2] / maxLen);
    }

    /**
     * Normalize product name
     */
    private normalizeName(name: string): string {
        if (!name) return '';
        
        // Convert to lowercase
        let normalized = name.toLowerCase();
        
        // Remove special characters, normalize spaces
        normalized = normalized
            .replace(/[^\w\s]/g, ' ')  // Replace special chars with space
            .replace(/\s+/g, ' ')      // Replace multiple spaces with single
            .trim();
            
        // Remove common marketing terms
        const termsToRemove = [
            'officially licensed', 'licensed', 'airsoft', 'gun', 'rifle', 
            'limited edition', 'special edition', 'new', 'generation'
        ];
        
        termsToRemove.forEach(term => {
            normalized = normalized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '');
        });
        
        return normalized.trim();
    }

    /**
     * Normalize brand name
     */
    private normalizeBrand(brand: string): string {
        if (!brand) return '';
        
        // Convert to lowercase
        let normalized = brand.toLowerCase().trim();
        
        // Brand name mapping for common variations
        const brandMap: Record<string, string> = {
            'vfc': 'elite force',
            'elite force': 'elite force',
            'eliteforce': 'elite force',
            'tokyo marui': 'tokyo marui',
            'tm': 'tokyo marui',
            'g&g': 'g&g',
            'g & g': 'g&g',
            'umarex': 'umarex',
            'cyma': 'cyma',
            'lancer tactical': 'lancer tactical',
            'lancer': 'lancer tactical',
            'unknown brand': ''
        };
        
        // Check if we have a mapping for this brand
        for (const [key, value] of Object.entries(brandMap)) {
            if (normalized.includes(key)) {
                return value;
            }
        }
        
        return normalized;
    }

    /**
     * Detect product category based on name
     */
    private detectCategory(name: string): string {
        const lowerName = name.toLowerCase();
        
        // More comprehensive keyword matching
        if (lowerName.includes('sniper') || lowerName.includes('bolt action') || lowerName.includes('dmr')) {
            return ProductCategories.SNIPER;
        } else if (lowerName.includes('rifle') || lowerName.includes('carbine') || 
                  lowerName.includes('aeg') || lowerName.includes('m4') || 
                  lowerName.includes('m16') || lowerName.includes('ak')) {
            return ProductCategories.RIFLE;
        } else if (lowerName.includes('pistol') || lowerName.includes('handgun')) {
            return ProductCategories.PISTOL;
        } else if (lowerName.includes('smg') || lowerName.includes('submachine') ||
                  lowerName.includes('mp5') || lowerName.includes('mp7')) {
            return ProductCategories.SMG;
        } else if (lowerName.includes('shotgun')) {
            return ProductCategories.SHOTGUN;
        } else if (lowerName.includes('lmg') || lowerName.includes('machine gun') ||
                  lowerName.includes('m249') || lowerName.includes('m60')) {
            return ProductCategories.LMG;
        } else if (lowerName.includes('part') || lowerName.includes('upgrade') || 
                  lowerName.includes('internal') || lowerName.includes('external') ||
                  lowerName.includes('accessory')) {
            return ProductCategories.PARTS;
        } else if (lowerName.includes('gear') || lowerName.includes('vest') || 
                  lowerName.includes('helmet') || lowerName.includes('clothing')) {
            return ProductCategories.GEAR;
        }
        
        // Default case
        return ProductCategories.RIFLE;
    }

    /**
     * Detect product type based on name
     */
    private detectType(name: string): string {
        const lowerName = name.toLowerCase();
        
        if (lowerName.includes('aeg') || lowerName.includes('automatic electric gun')) {
            return ProductTypes.AEG;
        } else if (lowerName.includes('gbbr')) {
            return ProductTypes.GBBR;
        } else if ((lowerName.includes('gbb') || lowerName.includes('gas blowback')) && 
                  lowerName.includes('pistol')) {
            return ProductTypes.GBB_PISTOL;
        } else if (lowerName.includes('spring')) {
            return ProductTypes.SPRING;
        } else if (lowerName.includes('hpa')) {
            return ProductTypes.HPA;
        } else if (lowerName.includes('co2')) {
            return ProductTypes.CO2;
        } else if (lowerName.includes('aep')) {
            return ProductTypes.AEP;
        }
        
        // Default case
        return ProductTypes.AEG;
    }

    /**
     * Detect product platform based on name
     */
    private detectPlatform(name: string): string {
        const lowerName = name.toLowerCase();
        
        // Pistol platforms
        if (lowerName.includes('glock')) {
            return ProductPlatforms.GLOCK;
        } else if (lowerName.includes('hi-capa') || lowerName.includes('hicapa') || lowerName.includes('hi capa')) {
            return ProductPlatforms.HI_CAPA;
        } else if (lowerName.includes('1911')) {
            return ProductPlatforms.M1911;
        } else if (lowerName.includes('p226')) {
            return ProductPlatforms.P226;
        } else if (lowerName.includes('beretta') || lowerName.includes('m9')) {
            return ProductPlatforms.BERETTA;
        } else if (lowerName.includes('cz')) {
            return ProductPlatforms.CZ;
        } else if (lowerName.includes('usp')) {
            return ProductPlatforms.USP;
            
        // Rifle platforms  
        } else if (lowerName.includes('m4') || lowerName.includes('m16') || 
                  lowerName.includes('ar-15') || lowerName.includes('ar15')) {
            return ProductPlatforms.M4;
        } else if (lowerName.includes('sr25') || lowerName.includes('ar-10') || lowerName.includes('ar10')) {
            return ProductPlatforms.SR25;
        } else if (lowerName.includes('ak') || lowerName.includes('ak47') || lowerName.includes('ak74')) {
            return ProductPlatforms.AK;
        } else if (lowerName.includes('mp5')) {
            return ProductPlatforms.MP5;
        } else if (lowerName.includes('scar')) {
            return ProductPlatforms.SCAR;
        } else if (lowerName.includes('g36')) {
            return ProductPlatforms.G36;
        } else if (lowerName.includes('famas')) {
            return ProductPlatforms.FAMAS;
        } else if (lowerName.includes('aug')) {
            return ProductPlatforms.AUG;
        } else if (lowerName.includes('kriss') || lowerName.includes('vector')) {
            return ProductPlatforms.KRISS;
            
        // Special categories
        } else if (lowerName.includes('dmr')) {
            return ProductPlatforms.DMR;
        } else if (lowerName.includes('bolt action')) {
            return ProductPlatforms.BOLT_ACTION;
        } else if (lowerName.includes('wwii') || lowerName.includes('ww2') || 
                  lowerName.includes('world war 2') || lowerName.includes('world war ii')) {
            return ProductPlatforms.WWII;
        }
        
        // Default case
        return ProductPlatforms.OTHER;
    }
}
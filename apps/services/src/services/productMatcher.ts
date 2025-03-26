import { SupabaseClient } from '@supabase/supabase-js';
import { stringSimilarity } from 'string-similarity-js';
import { ScrapedProduct } from '../types';

interface MatchResult {
  productId: number;
  confidenceScore: number;
  requiresReview: boolean;
}

export class ProductMatcher {
  private supabase: SupabaseClient;
  private confidenceThreshold = 0.8; // Minimum score for automatic match
  private reviewThreshold = 0.6; // Minimum score for a potential match that needs review

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Match a scraped product against the existing product database
   */
  async findMatch(product: ScrapedProduct, sourceStore: string, sourceIdentifier: string): Promise<MatchResult | null> {
    // 1. Check if we already have a match record for this store/identifier
    const { data: existingMatch } = await this.supabase
      .from('product_matches')
      .select('matched_product_id, confidence_score')
      .eq('source_store', sourceStore)
      .eq('source_identifier', sourceIdentifier)
      .single();

    if (existingMatch?.matched_product_id) {
      return {
        productId: existingMatch.matched_product_id,
        confidenceScore: existingMatch.confidence_score,
        requiresReview: false
      };
    }

    // 2. Look for potential matches by brand + simplified name
    const normalizedName = this.normalizeProductName(product.name);
    const normalizedBrand = this.normalizeBrand(product.brand);

    const { data: potentialMatches } = await this.supabase
      .from('products')
      .select('id, name, brand, type, category, platform')
      .eq('brand', normalizedBrand)
      .eq('category', product.category)
      .order('updated_at', { ascending: false });

    if (!potentialMatches || potentialMatches.length === 0) {
      return null;
    }

    // 3. Score each potential match
    const scoredMatches = potentialMatches.map(dbProduct => {
      const normalizedDbName = this.normalizeProductName(dbProduct.name);
      
      // Calculate various similarity components
      const nameScore = stringSimilarity(normalizedName, normalizedDbName);
      const categoryScore = dbProduct.category === product.category ? 1 : 0;
      const typeScore = dbProduct.type === product.type ? 1 : 0;
      
      // Safe platform matching - check if platform exists on product
      const platformScore = (dbProduct.platform && 
                            'platform' in product && 
                            dbProduct.platform === (product as any).platform) ? 1 : 0;
      
      // Calculate weighted score
      const weightedScore = (
        (nameScore * 0.6) + 
        (categoryScore * 0.2) + 
        (typeScore * 0.1) + 
        (platformScore * 0.1)
      );

      return {
        productId: dbProduct.id,
        confidenceScore: parseFloat(weightedScore.toFixed(4)),
        requiresReview: weightedScore >= this.reviewThreshold && weightedScore < this.confidenceThreshold
      };
    });

    // 4. Find best match
    scoredMatches.sort((a, b) => b.confidenceScore - a.confidenceScore);
    const bestMatch = scoredMatches[0];
    
    if (!bestMatch || bestMatch.confidenceScore < this.reviewThreshold) {
      return null;
    }

    // 5. Store the match result
    await this.supabase.from('product_matches').insert({
      source_store: sourceStore,
      source_identifier: sourceIdentifier,
      matched_product_id: bestMatch.productId,
      confidence_score: bestMatch.confidenceScore,
      requires_review: bestMatch.requiresReview
    });

    return bestMatch;
  }

  /**
   * Normalize a product name for better matching
   */
  private normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special chars
      .replace(/\b(airsoft|gun|rifle|pistol|aeg|gbb|gas|electric|blowback)\b/gi, '') // Remove common terms
      .replace(/\b(w\/|with)\b/gi, '') // Remove common connecting words
      .replace(/\b(full|metal|polymer|abs|nylon)\b/gi, '') // Remove common material terms
      .replace(/\d+mm/, '') // Remove measurements
      .replace(/\s{2,}/g, ' ') // Remove extra spaces
      .trim();
  }

  /**
   * Normalize brand names to handle variations
   */
  private normalizeBrand(brand: string): string {
    const brandMap: Record<string, string> = {
      'tokyo marui': 'tokyo marui',
      'tm': 'tokyo marui',
      'tokyomarui': 'tokyo marui',
      'g&g': 'g&g armament',
      'g&g armament': 'g&g armament',
      'g and g': 'g&g armament',
      'gandg': 'g&g armament',
      'kwa': 'kwa',
      'kwaaeg': 'kwa',
      'vfc': 'vfc',
      'vfcaeg': 'vfc',
      'elite force': 'elite force',
      'ef': 'elite force',
      'eliteforce': 'elite force',
      // Add more brand normalizations as needed
    };

    const normalizedBrand = brand.toLowerCase().trim();
    return brandMap[normalizedBrand] || normalizedBrand;
  }

  /**
   * Update the confidence thresholds for matching
   */
  setThresholds(confidenceThreshold: number, reviewThreshold: number) {
    this.confidenceThreshold = confidenceThreshold;
    this.reviewThreshold = reviewThreshold;
  }
} 
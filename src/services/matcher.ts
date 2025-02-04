import { ScrapedProduct } from '../types';
import { supabase } from '../lib/supabase';
import { ProductCategories, ProductTypes } from '../types';

export class ProductMatcher {
    async matchProduct(scrapedProduct: ScrapedProduct) {
        // Use fuzzy matching on product names
        const normalizedName = this.normalizeName(scrapedProduct.name);

        // Check if product already exists in our DB
        const { data: existingProduct } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${normalizedName}%`)
            .single();

        if (existingProduct) {
            return existingProduct.id;
        }

        // Create new product if no match found
        const { data: newProduct } = await supabase
            .from('products')
            .insert({
                name: scrapedProduct.name,
                brand: scrapedProduct.brand,
                category: this.detectCategory(scrapedProduct.name),
                type: this.detectType(scrapedProduct.name)
            })
            .select()
            .single();

        return newProduct.id;
    }

    private normalizeName(name: string): string {
        // Remove special characters, normalize spaces
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private detectCategory(name: string): string {
        // Simple keyword-based detection for categories
        if (name.includes('rifle')) {
            return ProductCategories.RIFLE;
        } else if (name.includes('pistol')) {
            return ProductCategories.PISTOL;
        } else if (name.includes('gear')) {
            return ProductCategories.GEAR;
        } else if (name.includes('part')) {
            return ProductCategories.PARTS;
        }
        return ProductCategories.GEAR;
    }

    private detectType(name: string): string {
        // Simple keyword-based detection for types
        if (name.includes('aeg')) {
            return ProductTypes.AEG;
        } else if (name.includes('gbbr')) {
            return ProductTypes.GBBR;
        } else if (name.includes('gbb pistol')) {
            return ProductTypes.GBB_PISTOL;
        } else if (name.includes('spring')) {
            return ProductTypes.SPRING;
        } else if (name.includes('hpa')) {
            return ProductTypes.HPA;
        }
        return ProductTypes.AEG;
    }
}
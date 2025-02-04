import type { ScrapedProduct } from '../types';
import { ProductPlatforms } from '../types';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { BaseScraper } from '../scrapers/base';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const platformDetection = (productDesc: string, name: string): string => {
    const lowerDesc = productDesc.toLowerCase();
    const lowerName = name.toLowerCase();

    // Pistol Platforms
    if (lowerName.includes('glock') || lowerDesc.includes('glock')) {
        return ProductPlatforms.GLOCK;
    }
    if (lowerName.includes('hi-capa') || lowerName.includes('hicapa') ||
        lowerDesc.includes('hi-capa') || lowerDesc.includes('hicapa')) {
        return ProductPlatforms.HI_CAPA;
    }
    if (lowerName.includes('1911') || lowerDesc.includes('1911')) {
        return ProductPlatforms.M1911;
    }
    if (lowerName.includes('p226') || lowerDesc.includes('p226')) {
        return ProductPlatforms.P226;
    }
    if (lowerName.includes('beretta') || lowerDesc.includes('beretta')) {
        return ProductPlatforms.BERETTA;
    }
    if (lowerName.includes('cz') || lowerDesc.includes('cz')) {
        return ProductPlatforms.CZ;
    }
    if (lowerName.includes('usp') || lowerDesc.includes('usp')) {
        return ProductPlatforms.USP;
    }

    // Rifle Platforms
    if ((lowerName.includes('m4') || lowerDesc.includes('m4')) &&
        !lowerName.includes('m41') && !lowerDesc.includes('m41')) {
        return ProductPlatforms.M4;
    }
    if (lowerName.includes('sr25') || lowerDesc.includes('sr25') ||
        lowerName.includes('sr-25') || lowerDesc.includes('sr-25')) {
        return ProductPlatforms.SR25;
    }
    if (lowerName.includes('ak') || lowerDesc.includes('ak47') ||
        lowerDesc.includes('ak-47') || lowerDesc.includes('ak74')) {
        return ProductPlatforms.AK;
    }
    if (lowerName.includes('mp5') || lowerDesc.includes('mp5')) {
        return ProductPlatforms.MP5;
    }
    if (lowerName.includes('scar') || lowerDesc.includes('scar')) {
        return ProductPlatforms.SCAR;
    }
    if (lowerName.includes('g36') || lowerDesc.includes('g36')) {
        return ProductPlatforms.G36;
    }
    if (lowerName.includes('famas') || lowerDesc.includes('famas')) {
        return ProductPlatforms.FAMAS;
    }
    if (lowerName.includes('aug') || lowerDesc.includes('aug')) {
        return ProductPlatforms.AUG;
    }
    if (lowerName.includes('kriss') || lowerDesc.includes('kriss vector') ||
        lowerDesc.includes('vector')) {
        return ProductPlatforms.KRISS;
    }

    // Special Categories
    if (lowerDesc.includes('wwii') || lowerDesc.includes('ww2') ||
        lowerDesc.includes('world war 2') || lowerDesc.includes('world war ii')) {
        return ProductPlatforms.WWII;
    }
    if (lowerName.includes('dmr') || lowerDesc.includes('dmr') ||
        lowerDesc.includes('designated marksman')) {
        return ProductPlatforms.DMR;
    }
    if (lowerDesc.includes('bolt action') || lowerName.includes('bolt action')) {
        return ProductPlatforms.BOLT_ACTION;
    }

    return ProductPlatforms.OTHER;
};

class ProductDetailScraper extends BaseScraper {
    baseUrl = '';
    storeName = '';

    async getProducts(): Promise<ScrapedProduct[]> {
        return [];
    }

    async getProductDetails(url: string, name: string): Promise<{ fps_min: number, fps_max: number, platform: string }> {
        try {
            const html = await this.fetch(url);
            const $ = cheerio.load(html);

            const details: { fps_min: number, fps_max: number, platform: string } = {
                fps_min: 0,
                fps_max: 0,
                platform: ProductPlatforms.OTHER
            };

            const productDesc = $('.product-desc').text();

            // FPS Range detection
            const fpsRangeMatch = productDesc.match(/FPS Range:\s*(\d+)-(\d+)/i);
            if (fpsRangeMatch) {
                details.fps_min = parseInt(fpsRangeMatch[1]);
                details.fps_max = parseInt(fpsRangeMatch[2]);
            } else {
                const muzzleVelocityMatch = productDesc.match(/Muzzle Velocity:\s*(\d+)~(\d+)\s*FPS/i);
                if (muzzleVelocityMatch) {
                    details.fps_min = parseInt(muzzleVelocityMatch[1]);
                    details.fps_max = parseInt(muzzleVelocityMatch[2]);
                }
            }

            // Platform detection
            details.platform = platformDetection(productDesc, name);

            return details;
        } catch (error) {
            console.error(`Error fetching product details from ${url}:`, error);
            return {
                fps_min: 0,
                fps_max: 0,
                platform: ProductPlatforms.OTHER
            };
        }
    }
}

async function updateProductDetails() {
    const scraper = new ProductDetailScraper();
    let processedCount = 0;

    try {
        // Get store_prices with URLs and product names
        const { data: storePrices, error: fetchError } = await supabase
            .from('store_prices')
            .select(`
                product_id, 
                url,
                products (
                    name
                )
            `)
            .not('url', 'is', null);

        if (fetchError) throw new Error(`Error fetching store prices: ${fetchError.message}`);

        console.log(`Found ${storePrices?.length || 0} products to process`);

        for (const storePrice of storePrices || []) {
            try {
                const details = await scraper.getProductDetails(
                    storePrice.url,
                    //@ts-expect-error not sure if this exists 😋
                    storePrice.products?.name || ''
                );

                if (Object.keys(details).length > 0) {
                    const { error: updateError } = await supabase
                        .from('products')
                        .update(details)
                        .eq('id', storePrice.product_id);

                    if (updateError) {
                        console.error(`Error updating product ${storePrice.product_id}:`, updateError);
                    } else {
                        console.log(`Updated product ${storePrice.product_id} with details:`, details);
                        processedCount++;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error processing product ${storePrice.product_id}:`, error);
            }
        }

        console.log(`Successfully processed ${processedCount} products`);

    } catch (error) {
        console.error('Error in updateProductDetails:', error);
    }
}

// Run the update script
updateProductDetails().then(() => {
    console.log('Update completed');
    process.exit(0);
}).catch((error) => {
    console.error('Error during update:', error);
    process.exit(1);
});

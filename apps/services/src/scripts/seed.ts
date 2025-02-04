import type { ScrapedProduct } from '../types';
import { createClient } from '@supabase/supabase-js';
import { EvikeScraper } from '../scrapers/evike';
import * as dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Anon Key in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PRODUCT_CATEGORIES = {
    rifle: {
        url: 'https://www.evike.com/index.php?cPath=21_44',
        name: 'rifle',
        type: 'AEG' // Default type for rifles
    },
    pistol: {
        url: 'https://www.evike.com/index.php?cPath=21_45',
        name: 'pistol',
        type: 'GBB' // Default type for pistols
    }
};

class CategoryEvikeScraper extends EvikeScraper {
    constructor(categoryUrl: string, private category: string, type: string) {
        super(type); // Pass type to parent constructor
        this.baseUrl = categoryUrl;
    }

    async getProducts(): Promise<ScrapedProduct[]> {
        const products = await super.getProducts();
        return products.map(product => ({
            ...product,
            category: this.category
        }));
    }
}

async function createProductWithStorePrices(scrapedProduct: ScrapedProduct) {
    // First, create the product entry
    const { data: createdProduct, error: productError } = await supabase
        .from('products')
        .insert({
            name: scrapedProduct.name,
            brand: scrapedProduct.brand,
            category: scrapedProduct.category,
            type: scrapedProduct.type,
            images: [scrapedProduct.imageUrl], // Store as array
            lowest_price: scrapedProduct.minPrice,
            highest_price: scrapedProduct.maxPrice,
            platform: null, // Can be updated later if needed
            fps_min: null, // Can be updated later if needed
            fps_max: null  // Can be updated later if needed
        })
        .select()
        .single();

    if (productError) {
        throw new Error(`Error creating product: ${productError.message}`);
    }

    // Then create the store_prices entry
    const { error: storePriceError } = await supabase
        .from('store_prices')
        .insert({
            product_id: createdProduct.id,
            store_name: scrapedProduct.storeId,
            price: scrapedProduct.price,
            shipping_cost: scrapedProduct.shipping.cost,
            free_shipping_threshold: scrapedProduct.shipping.freeThreshold,
            in_stock: scrapedProduct.inStock,
            url: scrapedProduct.url
        });

    if (storePriceError) {
        throw new Error(`Error creating store price: ${storePriceError.message}`);
    }

    // Add to price history
    const { error: priceHistoryError } = await supabase
        .from('price_history')
        .insert({
            product_id: createdProduct.id,
            store_name: scrapedProduct.storeId,
            price: scrapedProduct.price
        });

    if (priceHistoryError) {
        throw new Error(`Error creating price history: ${priceHistoryError.message}`);
    }

    return createdProduct;
}

async function seedProducts() {
    for (const [category, info] of Object.entries(PRODUCT_CATEGORIES)) {
        try {
            console.log(`Starting scrape for ${info.name} category`);
            const scraper = new CategoryEvikeScraper(info.url, category, info.type);
            const products = await scraper.getProducts();

            console.log(`Found ${products.length} products in ${info.name} category`);

            for (const product of products) {
                try {
                    // Check if product exists by name and brand
                    const { data: existingProduct } = await supabase
                        .from('products')
                        .select('id')
                        .eq('name', product.name)
                        .eq('brand', product.brand)
                        .single();

                    if (!existingProduct) {
                        await createProductWithStorePrices(product);
                        console.log(`Created product: ${product.name}`);
                    } else {
                        console.log(`Skipping existing product: ${product.name}`);
                    }
                } catch (error) {
                    console.error(`Error processing product ${product.name}:`, error);
                }

                // Small delay between products
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`Completed ${info.name} category`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error(`Error scraping ${info.name} category:`, error);
        }
    }
}

// Run the seeder
seedProducts().then(() => {
    console.log('Seeding completed');
    process.exit(0);
}).catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
});
import { ScrapedProduct } from '../types';
import { supabase } from '../db/supabase';
import { ProductMatcher } from './matcher';

export class PriceUpdater {
    constructor(private matcher: ProductMatcher) { }

    async updatePrices(scrapedProducts: ScrapedProduct[]) {
        for (const product of scrapedProducts) {
            const productId = await this.matcher.matchProduct(product);

            // Update store_prices
            await supabase
                .from('store_prices')
                .upsert({
                    product_id: productId,
                    store_name: product.storeId,
                    price: product.price,
                    shipping_cost: product.shipping.cost,
                    free_shipping_threshold: product.shipping.freeThreshold,
                    in_stock: product.inStock,
                    url: product.url
                }, {
                    onConflict: 'product_id,store_name'
                });

            // Add to price history
            await supabase
                .from('price_history')
                .insert({
                    product_id: productId,
                    store_name: product.storeId,
                    price: product.price
                });
        }
    }
}
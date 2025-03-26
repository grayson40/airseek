import { ScrapedProduct } from '../types';
import { supabase } from '../db/supabase';
import { ProductMatcher } from './matcher';
import { DataProcessor } from './processor';
import { MonitoringService } from './monitoring';

export class PriceUpdater {
    private processor: DataProcessor;
    
    constructor(
        private matcher: ProductMatcher,
        private monitoring: MonitoringService
    ) { 
        this.processor = new DataProcessor(monitoring);
    }

    /**
     * Update prices for a batch of scraped products
     */
    async updatePrices(scrapedProducts: ScrapedProduct[]): Promise<void> {
        if (!scrapedProducts.length) {
            console.log('No products to update');
            return;
        }
        
        const storeId = scrapedProducts[0].storeId;
        this.monitoring.recordOperationStart('price_update', { store: storeId });
        
        try {
            // Process the raw scraped products
            const processedProducts = await this.processor.processProducts(scrapedProducts, storeId);
            
            // Count metrics
            let newProductsCount = 0;
            let updatedProductsCount = 0;
            let unchangedProductsCount = 0;
            
            for (const product of processedProducts) {
                // Match product against existing products
                const productId = await this.matcher.matchProduct(product);
                
                // Check if the price has changed to determine if it needs to be recorded in history
                const { data: currentPrice } = await supabase
                    .from('store_prices')
                    .select('price')
                    .eq('product_id', productId)
                    .eq('store_name', product.storeId)
                    .single();
                
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
                        url: product.url,
                        image_url: product.imageUrl || null
                    }, {
                        onConflict: 'product_id,store_name'
                    });
                
                // Track metrics
                if (!currentPrice) {
                    // New product
                    newProductsCount++;
                    
                    // Always add new products to history
                    await this.addPriceHistory(productId, product);
                } else if (currentPrice.price !== product.price) {
                    // Price changed, update history
                    updatedProductsCount++;
                    
                    await this.addPriceHistory(productId, product);
                } else {
                    // No change
                    unchangedProductsCount++;
                }
            }
            
            // Record metrics
            this.monitoring.recordMetric('products_new', newProductsCount, { store: storeId });
            this.monitoring.recordMetric('products_updated', updatedProductsCount, { store: storeId });
            this.monitoring.recordMetric('products_unchanged', unchangedProductsCount, { store: storeId });
            
            console.log(`Updated: ${storeId} - ${updatedProductsCount} products updated, ${newProductsCount} new products`);
            
            this.monitoring.recordOperationEnd('price_update', { store: storeId });
            this.monitoring.recordOperationStatus('price_update', true, { store: storeId });
        } catch (error) {
            this.monitoring.recordOperationEnd('price_update', { store: storeId });
            this.monitoring.recordOperationStatus('price_update', false, { store: storeId });
            
            console.error(`Error updating prices for ${storeId}:`, error);
            throw error;
        }
    }
    
    /**
     * Add a new entry to the price history
     */
    private async addPriceHistory(productId: number, product: ScrapedProduct): Promise<void> {
        await supabase
            .from('price_history')
            .insert({
                product_id: productId,
                store_name: product.storeId,
                price: product.price,
                in_stock: product.inStock,
                recorded_at: new Date().toISOString()
            });
    }
}
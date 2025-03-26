import { SupabaseClient } from '@supabase/supabase-js';
import { ScrapedProduct } from '../types';
import { ProductMatcher } from './productMatcher';

interface ImportStats {
  processed: number;
  updated: number;
  new: number;
  errors: number;
}

export class ProductImporter {
  private supabase: SupabaseClient;
  private matcher: ProductMatcher;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.matcher = new ProductMatcher(supabaseClient);
  }

  /**
   * Process a batch of scraped products from a specific store
   */
  async importProducts(products: ScrapedProduct[], storeName: string): Promise<ImportStats> {
    const stats: ImportStats = {
      processed: 0,
      updated: 0,
      new: 0,
      errors: 0
    };

    // Start an agent operation for tracking
    const { data: operationData } = await this.supabase
      .from('agent_operations')
      .insert({
        agent_name: 'product_importer',
        operation_type: 'import',
        target_store: storeName,
        status: 'running',
        start_time: new Date().toISOString(),
        items_processed: 0,
        items_updated: 0,
        items_new: 0
      })
      .select()
      .single();

    const operationId = operationData?.id;

    try {
      for (const product of products) {
        try {
          stats.processed++;
          
          // Use the product URL as the source identifier
          const sourceIdentifier = product.url;
          
          // Try to find a match for this product
          const matchResult = await this.matcher.findMatch(product, storeName, sourceIdentifier);
          
          if (matchResult && !matchResult.requiresReview) {
            // Update existing product price in store_prices
            await this.updateProductPrice(matchResult.productId, product, storeName);
            stats.updated++;
            
            // Add to price history
            await this.addToPriceHistory(matchResult.productId, product.price, storeName);
          } else {
            // Create a new product
            const newProductId = await this.createNewProduct(product);
            stats.new++;
            
            // Add price for this store
            await this.updateProductPrice(newProductId, product, storeName);
            
            // Add to price history
            await this.addToPriceHistory(newProductId, product.price, storeName);
          }
        } catch (error) {
          console.error('Error processing product:', error);
          stats.errors++;
        }
      }

      // Update operation with final stats
      await this.supabase
        .from('agent_operations')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          items_processed: stats.processed,
          items_updated: stats.updated,
          items_new: stats.new
        })
        .eq('id', operationId);

    } catch (error) {
      console.error('Import operation failed:', error);
      
      // Update operation with error status
      if (operationId) {
        await this.supabase
          .from('agent_operations')
          .update({
            status: 'failed',
            end_time: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            items_processed: stats.processed,
            items_updated: stats.updated,
            items_new: stats.new
          })
          .eq('id', operationId);
      }
    }

    return stats;
  }

  /**
   * Update the price for a product at a specific store
   */
  private async updateProductPrice(productId: number, product: ScrapedProduct, storeName: string): Promise<void> {
    const { data } = await this.supabase
      .from('store_prices')
      .select('id')
      .eq('product_id', productId)
      .eq('store_name', storeName)
      .maybeSingle();

    if (data?.id) {
      // Update existing price
      await this.supabase
        .from('store_prices')
        .update({
          price: product.price,
          shipping_cost: product.shipping.cost,
          free_shipping_threshold: product.shipping.freeThreshold,
          in_stock: product.inStock,
          url: product.url,
          last_updated: new Date().toISOString()
        })
        .eq('id', data.id);
    } else {
      // Insert new price
      await this.supabase
        .from('store_prices')
        .insert({
          product_id: productId,
          store_name: storeName,
          price: product.price,
          shipping_cost: product.shipping.cost,
          free_shipping_threshold: product.shipping.freeThreshold,
          in_stock: product.inStock,
          url: product.url,
          last_updated: new Date().toISOString()
        });
    }
  }

  /**
   * Add a price point to the price history
   */
  private async addToPriceHistory(productId: number, price: number, storeName: string): Promise<void> {
    await this.supabase
      .from('price_history')
      .insert({
        product_id: productId,
        store_name: storeName,
        price: price,
        recorded_at: new Date().toISOString()
      });
  }

  /**
   * Create a new product in the database
   */
  private async createNewProduct(product: ScrapedProduct): Promise<number> {
    const { data } = await this.supabase
      .from('products')
      .insert({
        name: product.name,
        brand: product.brand,
        category: product.category,
        type: product.type,
        platform: (product as any).platform || null,
        lowest_price: product.price,
        highest_price: product.price,
        image_url: product.imageUrl,
        images: product.imageUrl ? [product.imageUrl] : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!data?.id) {
      throw new Error('Failed to create new product');
    }

    return data.id;
  }
} 
import { SupabaseClient } from '@supabase/supabase-js';
import express, { Request, Response } from 'express';

interface ApiQueryParams {
  category?: string;
  brand?: string;
  type?: string;
  platform?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  storeName?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  search?: string;
}

export class AirsoftApiService {
  private supabase: SupabaseClient;
  private router: express.Router;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.router = express.Router();
    this.setupRoutes();
  }

  getRouter(): express.Router {
    return this.router;
  }

  private setupRoutes(): void {
    // Get products with filtering and pagination
    this.router.get('/products', this.getProducts.bind(this));
    
    // Get a single product with all details
    this.router.get('/products/:id', this.getProductById.bind(this));
    
    // Get product prices from all stores
    this.router.get('/products/:id/prices', this.getProductPrices.bind(this));
    
    // Get product price history
    this.router.get('/products/:id/price-history', this.getProductPriceHistory.bind(this));
    
    // Get related products
    this.router.get('/products/:id/related', this.getRelatedProducts.bind(this));
    
    // Get product categories
    this.router.get('/categories', this.getCategories.bind(this));
    
    // Get brands
    this.router.get('/brands', this.getBrands.bind(this));
  }

  /**
   * Get products with filtering, sorting, and pagination
   */
  private async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const params = this.parseQueryParams(req.query);
      
      let query = this.supabase
        .from('products')
        .select(`
          id, 
          name, 
          brand, 
          category, 
          type, 
          platform, 
          fps_min,
          fps_max,
          image_url,
          images,
          lowest_price,
          highest_price
        `);
      
      // Apply filters
      if (params.category) {
        query = query.eq('category', params.category);
      }
      
      if (params.brand) {
        query = query.eq('brand', params.brand);
      }
      
      if (params.type) {
        query = query.eq('type', params.type);
      }
      
      if (params.platform) {
        query = query.eq('platform', params.platform);
      }
      
      if (params.minPrice) {
        query = query.gte('lowest_price', params.minPrice);
      }
      
      if (params.maxPrice) {
        query = query.lte('highest_price', params.maxPrice);
      }
      
      // Apply text search if provided
      if (params.search) {
        query = query.ilike('name', `%${params.search}%`);
      }
      
      // Count total before pagination
      const { count } = await this.supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      // Apply sorting
      const sortField = params.sort || 'created_at';
      const sortOrder = params.order || 'desc';
      query = query.order(sortField, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // If in_stock filter is requested, we need to join with store_prices
      if (params.inStock !== undefined || params.storeName) {
        const filteredData = await this.filterByStoreAvailability(
          data || [], 
          params.inStock || false, 
          params.storeName
        );
        
        res.json({
          data: filteredData,
          meta: {
            total: count,
            limit: params.limit || 20,
            offset: params.offset || 0
          }
        });
        return;
      }
      
      res.json({
        data: data || [],
        meta: {
          total: count,
          limit: params.limit || 20,
          offset: params.offset || 0
        }
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  /**
   * Get a single product with all its details
   */
  private async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Get product details
      const { data: product, error } = await this.supabase
        .from('products')
        .select(`
          id, 
          name, 
          brand, 
          category, 
          type, 
          platform, 
          fps_min,
          fps_max,
          image_url,
          images,
          lowest_price,
          highest_price,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      // Get product attributes
      const { data: attributes } = await this.supabase
        .from('product_attributes')
        .select('*')
        .eq('product_id', id)
        .single();
      
      // Get prices from all stores
      const { data: prices } = await this.supabase
        .from('store_prices')
        .select('*')
        .eq('product_id', id);
      
      // Combine data
      const fullProduct = {
        ...product,
        attributes: attributes || {},
        prices: prices || []
      };
      
      res.json(fullProduct);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  /**
   * Get product prices from all stores
   */
  private async getProductPrices(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const { data, error } = await this.supabase
        .from('store_prices')
        .select('*')
        .eq('product_id', id);
      
      if (error) {
        throw error;
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching product prices:', error);
      res.status(500).json({ error: 'Failed to fetch product prices' });
    }
  }

  /**
   * Get product price history
   */
  private async getProductPriceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const storeName = req.query.store as string;
      const days = parseInt(req.query.days as string) || 30;
      
      // Calculate date threshold
      const date = new Date();
      date.setDate(date.getDate() - days);
      const threshold = date.toISOString();
      
      let query = this.supabase
        .from('price_history')
        .select('*')
        .eq('product_id', id)
        .gte('recorded_at', threshold)
        .order('recorded_at', { ascending: true });
      
      if (storeName) {
        query = query.eq('store_name', storeName);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching price history:', error);
      res.status(500).json({ error: 'Failed to fetch price history' });
    }
  }

  /**
   * Get related products
   */
  private async getRelatedProducts(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const relationType = req.query.type as string || 'similar';
      
      const { data, error } = await this.supabase
        .from('related_products')
        .select(`
          relationship_type,
          strength,
          products:related_product_id (
            id,
            name,
            brand,
            category,
            type,
            platform,
            image_url,
            lowest_price,
            highest_price
          )
        `)
        .eq('product_id', id)
        .eq('relationship_type', relationType)
        .order('strength', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const relatedProducts = (data || []).map(item => ({
        ...item.products,
        relationship_strength: item.strength
      }));
      
      res.json(relatedProducts);
    } catch (error) {
      console.error('Error fetching related products:', error);
      res.status(500).json({ error: 'Failed to fetch related products' });
    }
  }

  /**
   * Get all product categories
   */
  private async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  /**
   * Get all brands
   */
  private async getBrands(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      res.json(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands' });
    }
  }

  /**
   * Filter products by store availability
   */
  private async filterByStoreAvailability(
    products: any[], 
    inStock: boolean, 
    storeName?: string
  ): Promise<any[]> {
    // Get all store prices for these products
    const productIds = products.map(p => p.id);
    
    let query = this.supabase
      .from('store_prices')
      .select('product_id, in_stock, store_name')
      .in('product_id', productIds);
    
    if (storeName) {
      query = query.eq('store_name', storeName);
    }
    
    if (inStock) {
      query = query.eq('in_stock', true);
    }
    
    const { data: availabilityData } = await query;
    
    if (!availabilityData || availabilityData.length === 0) {
      return [];
    }
    
    // Create a set of product IDs that match the filter
    const matchingProductIds = new Set(
      availabilityData.map(item => item.product_id)
    );
    
    // Filter the original products array
    return products.filter(product => matchingProductIds.has(product.id));
  }

  /**
   * Parse and validate query parameters
   */
  private parseQueryParams(query: any): ApiQueryParams {
    return {
      category: query.category as string,
      brand: query.brand as string,
      type: query.type as string,
      platform: query.platform as string,
      minPrice: query.minPrice ? parseFloat(query.minPrice as string) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice as string) : undefined,
      inStock: query.inStock ? query.inStock === 'true' : undefined,
      storeName: query.store as string,
      sort: query.sort as string,
      order: (query.order as 'asc' | 'desc') || 'desc',
      limit: query.limit ? parseInt(query.limit as string) : 20,
      offset: query.offset ? parseInt(query.offset as string) : 0,
      search: query.search as string
    };
  }
} 
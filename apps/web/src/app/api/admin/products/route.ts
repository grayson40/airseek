import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const id = searchParams.get('id'); // Check if an ID is provided
    
    // If ID is provided, return single product details
    if (id) {
      return getProductById(id);
    }
    
    // Build query for product list
    let query = supabase
      .from('products')
      .select(`
        id, 
        name, 
        brand, 
        category, 
        platform,
        type,
        image_url,
        fps_min,
        fps_max,
        description:type,
        lowest_price,
        highest_price,
        created_at,
        updated_at,
        store_prices(count)
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (brand) {
      query = query.eq('brand', brand);
    }
    
    const { data, error } = await query;
    
    // Get total count for pagination
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
    
    // Transform the data to include the stores count and add virtual sku for compatibility
    const transformedData = data.map(product => ({
      ...product,
      sku: `SKU-${product.id}`, // Generate a virtual SKU since it doesn't exist in the schema
      stores_count: product.store_prices[0]?.count || 0,
      store_prices: undefined
    }));
    
    return NextResponse.json({ 
      data: transformedData, 
      count,
      pagination: {
        offset,
        limit,
        total: count
      }
    });
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get product by ID
async function getProductById(id: string) {
  try {    
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      );
    }
    
    // Add virtual sku
    product.sku = `SKU-${product.id}`;
    
    // Get all store prices for this product
    const { data: storePrices, error: pricesError } = await supabase
      .from('store_prices')
      .select('*')
      .eq('product_id', id);
    
    if (pricesError) {
      console.error('Error fetching store prices:', pricesError);
      return NextResponse.json(
        { error: 'Failed to fetch store prices' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      product,
      storePrices
    });
  } catch (error) {
    console.error('Error in product detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
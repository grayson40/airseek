import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

type Props = Promise<{ id: string }>;

export async function GET(request: Request, props: { params: Props }) {
  try {
    const { id } = await props.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
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
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ productId: string }> }
) {
    try {
        const productId = parseInt((await params).productId);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: 'Invalid product ID' },
                { status: 400 }
            );
        }

        // Get product details with store prices in a single query
        const { data: product, error: productError } = await supabase
            .from('products')
            .select(`
                *,
                store_prices (
                    id,
                    store_name,
                    price,
                    shipping_cost,
                    free_shipping_threshold,
                    in_stock,
                    url,
                    last_updated
                )
            `)
            .eq('id', productId)
            .single();

        if (productError) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        // Get price history for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: priceHistory, error: historyError } = await supabase
            .from('price_history')
            .select('store_name, price, recorded_at')
            .eq('product_id', productId)
            .gte('recorded_at', thirtyDaysAgo.toISOString())
            .order('recorded_at', { ascending: true });

        if (historyError) {
            return NextResponse.json(
                { error: 'Error fetching price history' },
                { status: 500 }
            );
        }

        const formattedStorePrices = product.store_prices.map((store: any) => ({
            id: store.id,
            storeName: store.store_name,
            price: store.price,
            shipping: {
                cost: store.shipping_cost,
                freeThreshold: store.free_shipping_threshold
            },
            inStock: store.in_stock,
            url: store.url,
            lastUpdated: store.last_updated
        }));

        // Format the final response
        const formattedProduct = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            type: product.type,
            fps: {
                min: product.fps_min,
                max: product.fps_max
            },
            images: product.images,
            stores: formattedStorePrices,
            lowestPrice: product.lowest_price,
            highestPrice: product.highest_price,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            priceHistory: priceHistory
        };

        return NextResponse.json(formattedProduct);

    } catch (error) {
        console.error('Error in prices API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
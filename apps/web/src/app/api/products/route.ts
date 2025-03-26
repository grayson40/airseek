import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: Request,
) {
    try {
        // Extract the query parameters
        const url = new URL(request.url);
        let category = url.searchParams.get('category');
        const idsParam = url.searchParams.get('ids');
        const limit = url.searchParams.get('limit');
        
        // Parse IDs if provided
        const ids = idsParam ? idsParam.split(',').map(id => id.trim()) : null;

        // If category ends in 's', remove it
        if (category && category.endsWith('s')) {
            category = category.slice(0, -1);
        }

        // Base query
        let query = supabase
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
            `);
            
        // Filter by IDs if provided, otherwise filter by category
        if (ids && ids.length > 0) {
            query = query.in('id', ids);
        } else if (category) {
            query = query.eq('category', category);
        }

        // Limit the number of products if a limit is provided
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        
        const { data: products, error: productsError } = await query;

        if (productsError) {
            return NextResponse.json(
                { error: 'Products not found' },
                { status: 404 }
            );
        }

        const formattedProducts = products.map((product: any) => {
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

            return {
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                platform: product.platform,
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
            };
        });

        return NextResponse.json(formattedProducts);

    } catch (error) {
        console.error('Error in products API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
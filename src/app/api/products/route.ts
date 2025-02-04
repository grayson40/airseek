import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: Request,
) {
    try {
        // Extract the category query parameter
        const url = new URL(request.url);
        const category = url.searchParams.get('category');

        // Get all product details with store prices in a single query
        const { data: products, error: productsError } = await supabase
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
            .filter(category ? 'category' : 'id', category ? 'eq' : 'is', category || null); // Filter by category if provided

        if (productsError) {
            return NextResponse.json(
                { error: 'Products not found' },
                { status: 404 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedProducts = products.map((product: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
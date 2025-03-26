import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedProduct } from '../types';

export class AirsoftStationScraper extends BaseScraper {
    storeName = 'AirsoftStation';
    baseUrl = 'https://www.airsoftstation.com/airsoft-guns/';
    protected type: string = '';

    constructor(type: string = '') {
        super();
        this.type = type;
    }

    async getProducts(): Promise<ScrapedProduct[]> {
        const products: ScrapedProduct[] = [];
        let page = 1;
        let hasNextPage = true;

        while (hasNextPage && page <= 3) { // Limit to 3 pages for initial implementation
            try {
                console.log(`Scraping AirsoftStation page ${page}...`);
                const url = `${this.baseUrl}?page=${page}`;
                const html = await this.fetch(url);
                const $ = cheerio.load(html);

                // Each product is in a div with class 'product'
                $('.product').each((index, element) => {
                    const productElement = $(element);

                    // Extract product data
                    const name = productElement.find('.card-title').text().trim();
                    const priceText = productElement.find('.price').text().trim();
                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                    const productUrl = productElement.find('.card-title a').attr('href') || '';
                    const imageUrl = productElement.find('.card-image img').attr('src') || '';
                    
                    // Check availability - "out of stock" text or "add to cart" button indicate status
                    const outOfStockElement = productElement.find('.out-of-stock-label');
                    const inStock = outOfStockElement.length === 0;
                    
                    // Extract brand - often in product title or a separate element
                    let brand = 'Unknown Brand';
                    // Look for common brand names at the beginning of the product name
                    const brands = ['G&G', 'Lancer Tactical', 'KWA', 'Elite Force', 'Umarex', 'Tokyo Marui', 'CYMA', 'VFC'];
                    for (const knownBrand of brands) {
                        if (name.toLowerCase().startsWith(knownBrand.toLowerCase())) {
                            brand = knownBrand;
                            break;
                        }
                    }

                    if (name && !isNaN(price)) {
                        products.push({
                            name,
                            price,
                            minPrice: price,
                            maxPrice: price,
                            url: productUrl,
                            imageUrl,
                            inStock,
                            storeId: 'airsoftstation',
                            brand,
                            category: '', // Will be determined by ProductMatcher
                            shipping: {
                                cost: 0, // Default
                                freeThreshold: 99 // Airsoft Station typically has free shipping over $99
                            },
                            lastUpdated: new Date().toISOString(),
                            type: this.type,
                        });
                    }
                });

                // Check if there's a next page
                const nextPageLink = $('.pagination-container a.next');
                hasNextPage = nextPageLink.length > 0;
                page++;

                // Be nice to their servers
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`Error scraping AirsoftStation page ${page}:`, error);
                break;
            }
        }

        return products;
    }
} 
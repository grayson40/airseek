import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedProduct } from '../types';

export class RedWolfScraper extends BaseScraper {
    storeName = 'RedWolf';
    baseUrl = 'https://www.redwolfairsoft.com/guns/airsoft-rifles';
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
                console.log(`Scraping RedWolf page ${page}...`);
                const url = `${this.baseUrl}?p=${page}`;
                const html = await this.fetch(url);
                const $ = cheerio.load(html);

                // Each product is in a div with class 'product-item-info'
                $('.product-item-info').each((index, element) => {
                    const productElement = $(element);

                    // Extract product data
                    const name = productElement.find('.product-item-link').text().trim();
                    const priceText = productElement.find('.price').text().trim();
                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                    const productUrl = productElement.find('.product-item-link').attr('href') || '';
                    const imageUrl = productElement.find('.product-image-photo').attr('src') || '';
                    
                    // Check availability - products without "out of stock" label are assumed in stock
                    const outOfStockElement = productElement.find('.stock.unavailable');
                    const inStock = outOfStockElement.length === 0;
                    
                    // Extract brand from product name (common format is "BRAND - Product Name")
                    let brand = 'Unknown Brand';
                    if (name.includes('-')) {
                        brand = name.split('-')[0].trim();
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
                            storeId: 'redwolf',
                            brand,
                            category: '', // Will be determined by ProductMatcher
                            shipping: {
                                cost: 0, // Default, can be updated with actual data
                                freeThreshold: 300 // Default, can be updated with actual data
                            },
                            lastUpdated: new Date().toISOString(),
                            type: this.type,
                        });
                    }
                });

                // Check if there's a next page
                const nextPageLink = $('.pages-item-next a');
                hasNextPage = nextPageLink.length > 0;
                page++;

                // Be nice to their servers
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`Error scraping RedWolf page ${page}:`, error);
                break;
            }
        }

        return products;
    }
} 
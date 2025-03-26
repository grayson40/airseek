import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedProduct } from '../types';

export class AirsoftGIScraper extends BaseScraper {
    storeName = 'AirsoftGI';
    baseUrl = 'https://www.airsoftgi.com/Airsoft-Guns-c-139/';
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
                console.log(`Scraping AirsoftGI page ${page}...`);
                const url = `${this.baseUrl}?page=${page}`;
                const html = await this.fetch(url);
                const $ = cheerio.load(html);

                // Each product is in a div with class 'product-card'
                $('.product-card').each((index, element) => {
                    const productElement = $(element);

                    // Extract product data
                    const name = productElement.find('.card-title').text().trim();
                    const priceText = productElement.find('.price_sale').text().trim() || 
                                    productElement.find('.price_our').text().trim();
                    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                    const productUrl = productElement.find('.card-title a').attr('href') || '';
                    const imageUrl = productElement.find('.card-image img').attr('src') || '';
                    
                    // Check availability - "in stock" label indicates availability
                    const stockStatus = productElement.find('.product-stock').text().trim().toLowerCase();
                    const inStock = stockStatus.includes('in stock');
                    
                    // Extract brand - usually found in product descriptions or attributes
                    // For AirsoftGI, we might need a secondary request to get full details
                    // Simplified approach for now
                    let brand = 'Unknown Brand';
                    const brandElement = productElement.find('.product-brand').text().trim();
                    if (brandElement) {
                        brand = brandElement;
                    }

                    if (name && !isNaN(price)) {
                        products.push({
                            name,
                            price,
                            minPrice: price,
                            maxPrice: price,
                            url: this.normalizeUrl(productUrl),
                            imageUrl: this.normalizeUrl(imageUrl),
                            inStock,
                            storeId: 'airsoftgi',
                            brand,
                            category: '', // Will be determined by ProductMatcher
                            shipping: {
                                cost: 0, // Default
                                freeThreshold: 150 // AirsoftGI often has free shipping over $150
                            },
                            lastUpdated: new Date().toISOString(),
                            type: this.type,
                        });
                    }
                });

                // Check if there's a next page
                const nextPageLink = $('.pagination a').filter((i, el) => $(el).text().includes('Next'));
                hasNextPage = nextPageLink.length > 0;
                page++;

                // Be nice to their servers
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`Error scraping AirsoftGI page ${page}:`, error);
                break;
            }
        }

        return products;
    }

    private normalizeUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('//')) return `https:${url}`;
        if (url.startsWith('/')) return `https://www.airsoftgi.com${url}`;
        if (!url.startsWith('http')) return `https://www.airsoftgi.com/${url}`;
        return url;
    }
} 
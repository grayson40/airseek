import * as cheerio from 'cheerio';
import { BaseScraper } from './base';
import type { ScrapedProduct } from '../../types';

export class EvikeScraper extends BaseScraper {
    storeName = 'Evike';
    baseUrl = 'https://www.evike.com/index.php?cPath=21_45';
    protected type: string = '';

    constructor(type: string = '') {
        super();
        this.type = type;
    }

    async getProducts(): Promise<ScrapedProduct[]> {
        const products: ScrapedProduct[] = [];
        const page = 1; // Only scrape the first page
        let hasNextPage = true;

        while (hasNextPage) {
            try {
                console.log(`Scraping Evike page ${page}...`);
                const url = `${this.baseUrl}&page=${page}`;
                const html = await this.fetch(url);
                const $ = cheerio.load(html);

                // Each product is in a div with class 'plistitem'
                $('.plistitem').each((index, element) => {
                    const productElement = $(element);

                    // Use the current index for the price selector
                    const priceText = productElement.find(`#pprice${index}`).text().trim();
                    let minPrice = 0;
                    let maxPrice = 0;

                    if (priceText.includes('-')) {
                        // Handle price ranges
                        const [minStr, maxStr] = priceText.split('-');
                        minPrice = parseFloat(minStr.replace(/[^0-9.]/g, ''));
                        maxPrice = parseFloat(maxStr.replace(/[^0-9.]/g, ''));
                    } else {
                        // Single price
                        minPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                        maxPrice = minPrice;
                    }

                    const productUrl = productElement.find('a').first().attr('href') || '';
                    const imageUrl = productElement.find('.product-image').attr('src') || '';
                    const name = productElement.find(`#pname${index}`).text().trim();
                    const inStock = !productElement.find('h4').text().includes('OUT OF STOCK');
                    const brand = productElement.find('.brandlogo1').attr('alt')?.trim() ||
                        productElement.find('.brandname').text().trim() ||
                        'Unknown Brand';

                    if (name && (!isNaN(minPrice) || !isNaN(maxPrice))) {
                        products.push({
                            name,
                            price: minPrice, // Current price
                            minPrice,        // Lowest observed price
                            maxPrice,        // Highest observed price
                            url: this.normalizeUrl(productUrl),
                            imageUrl: this.normalizeUrl(imageUrl),
                            inStock,
                            storeId: 'evike',
                            brand,
                            category: '', // Will be set by CategoryEvikeScraper
                            shipping: {
                                cost: 0,
                                freeThreshold: 150
                            },
                            lastUpdated: new Date().toISOString(),
                            type: this.type,
                        });
                    }
                });

                // Set hasNextPage to false since we are only scraping one page
                hasNextPage = false;

                // Be nice to their servers
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`Error scraping page ${page}:`, error);
                break;
            }
        }

        return products;
    }

    private normalizeUrl(url: string): string {
        if (!url) return '';
        if (url.startsWith('//')) return `https:${url}`;
        if (url.startsWith('/')) return `https://www.evike.com${url}`;
        if (!url.startsWith('http')) return `https://www.evike.com/${url}`;
        return url;
    }
}
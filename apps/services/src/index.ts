import * as dotenv from 'dotenv';
dotenv.config();

import { EvikeScraper } from './scrapers/evike';
import { ProductMatcher } from './services/matcher';
import { PriceUpdater } from './services/updater';

export async function updateAllPrices() {
    const scraper = new EvikeScraper();
    const matcher = new ProductMatcher();
    const updater = new PriceUpdater(matcher);
    
    try {
        console.log(`Starting scrape for ${scraper.storeName}`);
        const products = await scraper.getProducts();
        await updater.updatePrices(products);
        console.log(`Completed ${scraper.storeName}`);
    } catch (error) {
        console.error(`Error in price update:`, error);
    }
}

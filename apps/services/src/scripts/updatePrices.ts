import { EvikeScraper } from '../scrapers/evike';
// import { RedWolfScraper } from '../scrapers/redwolf';
// import { AirsoftGIScraper } from '../scrapers/airsoftgi';
import { ProductMatcher } from '../services/matcher';
import { PriceUpdater } from '../services/updater';
import * as dotenv from 'dotenv';
import { MonitoringService } from '../services/monitoring';
dotenv.config();

async function updateAllPrices() {
    const scrapers = [
        new EvikeScraper(),
        // new RedWolfScraper(),
        // new AirsoftGIScraper()
    ];

    const matcher = new ProductMatcher();
    const monitoring = new MonitoringService();
    const updater = new PriceUpdater(matcher, monitoring);
    
    for (const scraper of scrapers) {
        try {
            console.log(`Starting scrape for ${scraper.storeName}`);
            const products = await scraper.getProducts();
            await updater.updatePrices(products);
            console.log(`Completed ${scraper.storeName}`);
        } catch (error) {
            console.error(`Error scraping ${scraper.storeName}:`, error);
        }
    }
}

// // Run with a scheduler
// import cron from 'node-cron';

// // Run every 6 hours
// cron.schedule('0 */6 * * *', updateAllPrices);

updateAllPrices();
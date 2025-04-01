import * as dotenv from 'dotenv';
dotenv.config();

import { EvikeScraper } from './scrapers/evike';
import { RedWolfScraper } from './scrapers/redwolf';
import { AirsoftGIScraper } from './scrapers/airsoftgi';
import { AirsoftStationScraper } from './scrapers/airsoftstation';
import { ProductMatcher } from './services/matcher';
import { PriceUpdater } from './services/updater';
import { AgentCoordinator, STORES } from './services/coordinator';
import { MonitoringService } from './services/monitoring';
import { createServer } from './server';

// Initialize services
const monitoring = new MonitoringService();
const coordinator = new AgentCoordinator(monitoring);

// Legacy function for backwards compatibility
export async function updateAllPrices() {
    await coordinator.runAllScrapers();
}

// Initialize the system
export async function initSystem() {
    console.log('Initializing airsoft price comparison system...');
    
    // Start monitoring service
    monitoring.start();
    console.log('Monitoring service started');
    
    // Register scrapers
    coordinator.registerScraper(STORES.EVIKE, new EvikeScraper());
    // coordinator.registerScraper(STORES.REDWOLF, new RedWolfScraper());
    // coordinator.registerScraper(STORES.AIRSOFT_GI, new AirsoftGIScraper());
    // coordinator.registerScraper(STORES.AIRSOFT_STATION, new AirsoftStationScraper());
    
    // Not all scrapers are implemented yet - notice in logs about which ones are active
    console.log(`Registered ${coordinator.getRegisteredScraperCount()} scrapers: ${coordinator.getRegisteredScraperNames().join(', ')}`);
    
    // Schedule scrapers - every 6 hours by default
    coordinator.scheduleAllScrapers('0 */6 * * *');
    console.log('Scheduled all scrapers to run every 6 hours');
    
    // Start server for health checks and monitoring
    const server = await createServer(coordinator, monitoring);
    console.log(`API server running on port ${process.env.PORT || 8001}`);
    
    console.log('Airsoft price comparison system initialized');
    return { coordinator, monitoring, server };
}

// Graceful shutdown handler
async function shutdown() {
    console.log('Shutting down...');
    
    // Stop the monitoring service
    monitoring.stop();
    console.log('Monitoring service stopped');
    
    // Any additional cleanup
    
    process.exit(0);
}

// Register shutdown handlers
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Initialize if running directly
if (require.main === module) {
    initSystem().then(({ coordinator }) => {
        // console.log('System ready, running initial scrape...');
        // // Run an initial scrape
        // coordinator.runAllScrapers().catch(error => {
        //     console.error('Error during initial scrape:', error);
        // });
    }).catch(error => {
        console.error('Error initializing system:', error);
        process.exit(1);
    });
}

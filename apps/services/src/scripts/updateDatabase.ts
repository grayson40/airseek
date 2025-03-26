import { AgentCoordinator, STORES } from '../services/coordinator';
import { MonitoringService } from '../services/monitoring';
import { ProductImporter } from '../services/productImporter';
import { supabase } from '../db/supabase';

// Import all scrapers
import { EvikeScraper } from '../scrapers/evike';
import { AirsoftGIScraper } from '../scrapers/airsoftgi';
import { AirsoftStationScraper } from '../scrapers/airsoftstation';
import { RedWolfScraper } from '../scrapers/redwolf';
import { BaseScraper } from '../scrapers/base';

interface ImportStats {
  processed: number;
  updated: number;
  new: number;
  errors: number;
}

interface ImportResult {
  store: string;
  stats?: ImportStats;
  status?: string;
  reason?: string;
  error?: string;
}

/**
 * Run the complete database update process:
 * 1. Scrape all stores
 * 2. Import and match products
 */
async function updateDatabase() {
  console.log('🚀 Starting database update process...');
  
  try {
    // Setup monitoring
    const monitoring = new MonitoringService();
    monitoring.start();
    
    // Setup coordinator
    const coordinator = new AgentCoordinator(monitoring);
    
    // Create and register all scrapers
    const evikeScraper = new EvikeScraper();
    const airsoftGiScraper = new AirsoftGIScraper();
    const airsoftStationScraper = new AirsoftStationScraper();
    const redWolfScraper = new RedWolfScraper();
    
    coordinator.registerScraper(STORES.EVIKE, evikeScraper);
    coordinator.registerScraper(STORES.AIRSOFT_GI, airsoftGiScraper);
    coordinator.registerScraper(STORES.AIRSOFT_STATION, airsoftStationScraper);
    coordinator.registerScraper(STORES.REDWOLF, redWolfScraper);
    
    // Keep track of scrapers locally
    const scrapers: Record<string, BaseScraper> = {
      [STORES.EVIKE]: evikeScraper,
      [STORES.AIRSOFT_GI]: airsoftGiScraper,
      [STORES.AIRSOFT_STATION]: airsoftStationScraper,
      [STORES.REDWOLF]: redWolfScraper
    };
    
    // Setup product importer
    const productImporter = new ProductImporter(supabase);
    
    // Step 1: Scrape all stores
    console.log('📡 Starting scraping for all stores...');
    await coordinator.runAllScrapers();
    
    // Wait for all scraping to complete - we'll need to implement this in coordinator
    console.log('⏳ Waiting for all operations to complete...');
    // For now, just wait 10 minutes to allow scraping to complete
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
    
    // Step 2: Import and match products
    console.log('📥 Importing products for all stores...');
    // We'll need to get these from the coordinator's registered scrapers
    const allStores = Object.values(STORES);
    const results: ImportResult[] = [];
    
    for (const store of allStores) {
      try {
        console.log(`⚙️ Processing store: ${store}`);
        
        // Get scraper from our local reference
        const scraper = scrapers[store];
        if (!scraper) {
          console.log(`⚠️ No scraper registered for ${store}, skipping...`);
          results.push({ store, status: 'skipped', reason: 'No scraper registered' });
          continue;
        }
        
        console.log(`📥 Fetching products from ${store}...`);
        const products = await scraper.getProducts();
        
        if (products && products.length > 0) {
          console.log(`💾 Importing ${products.length} products from ${store}...`);
          const importStats = await productImporter.importProducts(products, store);
          
          console.log(`✅ Import completed for ${store}:`, {
            processed: importStats.processed,
            updated: importStats.updated,
            new: importStats.new,
            errors: importStats.errors
          });
          
          results.push({ store, stats: importStats });
        } else {
          console.log(`⚠️ No products found for ${store}, skipping...`);
          results.push({ store, status: 'skipped', reason: 'No products found' });
        }
      } catch (error) {
        console.error(`❌ Error processing store ${store}:`, error);
        results.push({ 
          store, 
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Step 3: Generate final report
    console.log('\n📊 Final Import Report:');
    console.table(results.map(r => {
      if (r.stats) {
        return {
          store: r.store,
          status: 'success',
          processed: r.stats.processed,
          updated: r.stats.updated,
          new: r.stats.new,
          errors: r.stats.errors
        };
      }
      return {
        store: r.store,
        status: r.status || 'unknown',
        reason: r.reason || r.error || 'Unknown reason'
      };
    }));
    
    console.log('🎉 Database update process completed successfully!');
    
    // Clean up
    monitoring.stop();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database update process failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  updateDatabase().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} 
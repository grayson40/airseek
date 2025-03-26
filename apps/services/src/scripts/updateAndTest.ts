import { AgentCoordinator, STORES } from '../services/coordinator';
import { MonitoringService } from '../services/monitoring';
import { ProductImporter } from '../services/productImporter';
import { supabase } from '../db/supabase';
import { EvikeScraper } from '../scrapers/evike';

/**
 * Run a complete scrape and import process using the real infrastructure
 */
async function updateAndTestDatabase() {
  console.log('🚀 Starting real scrape and import test...');
  
  try {
    // Initialize monitoring service
    console.log('⚙️ Setting up monitoring service...');
    const monitoring = new MonitoringService();
    monitoring.start();
    
    // Initialize the coordinator with the monitoring service
    console.log('⚙️ Setting up agent coordinator...');
    const coordinator = new AgentCoordinator(monitoring);
    
    // Register a scraper for Evike (or any other store you want to test with)
    const testStore = STORES.EVIKE;
    console.log(`📌 Registering scraper for ${testStore}...`);
    coordinator.registerScraper(testStore, new EvikeScraper());
    
    // Initialize the product importer
    console.log('⚙️ Setting up product importer...');
    const productImporter = new ProductImporter(supabase);
    
    // Run the scraping process
    console.log(`🔍 Starting scrape for ${testStore}...`);
    await coordinator.runScraping(testStore);
    
    // Wait for scraping to complete
    console.log('⏳ Waiting for scraping to complete...');
    await coordinator.waitForAllOperations();
    
    // Get the latest scrape results
    console.log(`📊 Retrieving scrape results for ${testStore}...`);
    const scrapeResult = await coordinator.getLatestScrapeResults(testStore);
    
    if (!scrapeResult || !scrapeResult.products || scrapeResult.products.length === 0) {
      throw new Error(`No products scraped from ${testStore}`);
    }
    
    console.log(`✅ Successfully scraped ${scrapeResult.products.length} products from ${testStore}`);
    
    // Let's take just the first product for testing the import
    const sampleProduct = scrapeResult.products[0];
    console.log(`🔎 Sample product: ${sampleProduct.name} (${sampleProduct.price})`);
    
    // Import just one product to test
    console.log('📥 Importing sample product to database...');
    const importStats = await productImporter.importProducts([sampleProduct], testStore);
    
    // Log results
    console.log('✅ Import completed:');
    console.log(`Products processed: ${importStats.processed}`);
    console.log(`Products updated: ${importStats.updated}`);
    console.log(`Products new: ${importStats.new}`);
    console.log(`Errors: ${importStats.errors}`);
    
    // Verify the product was imported
    console.log('🔍 Verifying product in database...');
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('name', sampleProduct.name)
      .limit(1);
    
    if (products && products.length > 0) {
      console.log('✅ Product found in database:');
      console.log(JSON.stringify(products[0], null, 2));
      
      // Also check if price was recorded
      const { data: prices } = await supabase
        .from('store_prices')
        .select('*')
        .eq('product_id', products[0].id)
        .eq('store_name', testStore);
      
      if (prices && prices.length > 0) {
        console.log('✅ Price entry found:');
        console.log(JSON.stringify(prices[0], null, 2));
      } else {
        console.error('❌ No price entry found for the product!');
      }
      
      const { data: priceHistory } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', products[0].id)
        .eq('store_name', testStore);
      
      if (priceHistory && priceHistory.length > 0) {
        console.log('✅ Price history entry found:');
        console.log(JSON.stringify(priceHistory[0], null, 2));
      } else {
        console.error('❌ No price history entry found for the product!');
      }
    } else {
      console.error('❌ Product not found in database!');
    }
    
    // Optional: Import all the products
    if (scrapeResult.products.length > 1) {
      const userResponse = await askUserPrompt('Do you want to import all products? (y/n): ');
      if (userResponse.toLowerCase() === 'y') {
        console.log(`📥 Importing all ${scrapeResult.products.length} products...`);
        const fullImportStats = await productImporter.importProducts(scrapeResult.products, testStore);
        console.log('✅ Full import completed:');
        console.log(`Products processed: ${fullImportStats.processed}`);
        console.log(`Products updated: ${fullImportStats.updated}`);
        console.log(`Products new: ${fullImportStats.new}`);
        console.log(`Errors: ${fullImportStats.errors}`);
      }
    }
    
    console.log('🎉 Test completed successfully!');
    
    // Cleanup
    monitoring.stop();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

/**
 * Simple utility to ask for user input
 */
function askUserPrompt(question: string): Promise<string> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the test if this script is executed directly
if (require.main === module) {
  updateAndTestDatabase();
} 
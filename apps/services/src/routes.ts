import { Router, Request, Response } from 'express';
import { AgentCoordinator } from './services/coordinator';
import { ProductImporter } from './services/productImporter';

/**
 * Configure routes for the API server
 */
export function configureRoutes(
  router: Router,
  coordinator: AgentCoordinator,
  productImporter: ProductImporter
): Router {
  
  // Health check endpoint
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const health = await coordinator.getSystemHealth();
      res.status(200).json(health);
    } catch (error) {
      res.status(500).json({
        error: 'Health check failed',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Stats endpoint
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await coordinator.getOperationStats(10);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get stats',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Trigger a scrape for a specific store
  router.post('/scrape/:store', async (req: Request, res: Response) => {
    const { store } = req.params;
    
    try {
      await coordinator.runScraping(store);
      res.status(202).json({ message: `Scraping job started for ${store}` });
    } catch (error) {
      res.status(400).json({ 
        error: 'Failed to start scraping job',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Trigger all scrapers
  router.post('/scrape-all', async (req: Request, res: Response) => {
    try {
      await coordinator.runAllScrapers();
      res.status(202).json({ message: 'Scraping jobs started for all stores' });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to start scraping jobs',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Import products from scrape results
  // router.post('/import/:store', async (req: Request, res: Response) => {
  //   const { store } = req.params;
    
  //   try {
  //     const scrapeResult = await coordinator.getLatestScrapeResults(store);
      
  //     if (!scrapeResult || !scrapeResult.products || scrapeResult.products.length === 0) {
  //       return res.status(404).json({ error: 'No scrape results found for import' });
  //     }
      
  //     const importStats = await productImporter.importProducts(scrapeResult.products, store);
      
  //     res.status(200).json({
  //       message: `Import completed for ${store}`,
  //       stats: importStats
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       error: 'Failed to import products',
  //       message: error instanceof Error ? error.message : String(error)
  //     });
  //   }
  // });

  // Import products from all latest scrapes
  router.post('/import-all', async (req: Request, res: Response) => {
    try {
      const allStores = await coordinator.getAllStoreNames();
      const results: any[] = [];
      
      for (const store of allStores) {
        try {
          const scrapeResult = await coordinator.getLatestScrapeResults(store);
          
          if (scrapeResult && scrapeResult.products && scrapeResult.products.length > 0) {
            const importStats = await productImporter.importProducts(scrapeResult.products, store);
            results.push({ store, stats: importStats });
          } else {
            results.push({ store, status: 'skipped', reason: 'No scrape results found' });
          }
        } catch (error) {
          results.push({ 
            store, 
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      res.status(200).json({
        message: 'Import completed for all stores',
        results
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to import products',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return router;
} 
import express, { Request, Response, NextFunction } from 'express';
import { AgentCoordinator } from './services/coordinator';
import { MonitoringService } from './services/monitoring';
import { supabase } from './db/supabase';
import { AirsoftApiService } from './services/apiService';
import { ProductImporter } from './services/productImporter';
import { configureRoutes } from './routes';

/**
 * Create an Express server for health checks and monitoring
 */
export async function createServer(coordinator: AgentCoordinator, monitoring: MonitoringService) {
    const app = express();
    const port = process.env.PORT || 8000;

    // Initialize services
    const productImporter = new ProductImporter(supabase);
    const apiService = new AirsoftApiService(supabase);

    // Middleware
    app.use(express.json());

    // API endpoints
    app.use('/api', apiService.getRouter());
    
    // Setup main routes
    const mainRouter = express.Router();
    configureRoutes(mainRouter, coordinator, productImporter);
    app.use('/', mainRouter);

    // Error handling middleware
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).json({
            error: 'Server Error',
            message: err.message
        });
    });

    // Start the server
    return new Promise<express.Express>((resolve) => {
        app.listen(port, () => {
            console.log(`🚀 Server ready at http://localhost:${port}`);
            resolve(app);
        });
    });
}

// If this file is run directly, start the server
if (require.main === module) {
    // Import needed modules directly
    import('./services/coordinator').then(({ AgentCoordinator, STORES }) => {
        import('./services/monitoring').then(({ MonitoringService }) => {
            import('./scrapers/evike').then(({ EvikeScraper }) => {
                // Initialize services
                const monitoring = new MonitoringService();
                const coordinator = new AgentCoordinator(monitoring);
                
                // Register at least one scraper for testing
                coordinator.registerScraper(STORES.EVIKE, new EvikeScraper());
                
                // Start monitoring
                monitoring.start();
                
                // Create and start the server
                createServer(coordinator, monitoring)
                    .then(() => {
                        console.log('Server started successfully');
                    })
                    .catch(err => {
                        console.error('Failed to start server:', err);
                        process.exit(1);
                    });
            });
        });
    });
}
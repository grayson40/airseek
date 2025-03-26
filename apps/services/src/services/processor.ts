import { ScrapedProduct } from '../types';
import { MonitoringService } from './monitoring';

/**
 * Data Processing Pipeline for transforming raw scraped data
 */
export class DataProcessor {
    constructor(private monitoring: MonitoringService) {}

    /**
     * Process an array of scraped products
     */
    async processProducts(products: ScrapedProduct[], storeId: string): Promise<ScrapedProduct[]> {
        this.monitoring.recordOperationStart('data_processing', { store: storeId });
        
        try {
            // Step 1: Clean the data
            const cleanedProducts = this.cleanData(products);
            
            // Step 2: Validate the data
            const validatedProducts = this.validateData(cleanedProducts);
            
            // Step 3: Enhance with additional data
            const enhancedProducts = this.enhanceData(validatedProducts);
            
            // Step 4: Detect anomalies
            const checkedProducts = this.detectAnomalies(enhancedProducts, storeId);
            
            // Step 5: Standardize formats
            const standardizedProducts = this.standardizeFormats(checkedProducts);
            
            // Record metrics
            const processingRate = validatedProducts.length / products.length;
            this.monitoring.recordMetric('processing_success_rate', processingRate, { store: storeId });
            this.monitoring.recordMetric('products_processed', validatedProducts.length, { store: storeId });
            
            this.monitoring.recordOperationEnd('data_processing', { store: storeId });
            this.monitoring.recordOperationStatus('data_processing', true, { store: storeId });
            
            return standardizedProducts;
        } catch (error) {
            this.monitoring.recordOperationEnd('data_processing', { store: storeId });
            this.monitoring.recordOperationStatus('data_processing', false, { store: storeId });
            throw error;
        }
    }

    /**
     * Clean raw scraped data
     */
    private cleanData(products: ScrapedProduct[]): ScrapedProduct[] {
        return products.map(product => {
            // Trim whitespace from text fields
            const name = product.name.trim();
            const brand = product.brand.trim();
            
            // Remove currency symbols and normalize prices
            const price = typeof product.price === 'string' 
                ? parseFloat((product.price as string).replace(/[^0-9.]/g, '')) 
                : product.price;
                
            const minPrice = typeof product.minPrice === 'string' 
                ? parseFloat((product.minPrice as string).replace(/[^0-9.]/g, '')) 
                : product.minPrice;
                
            const maxPrice = typeof product.maxPrice === 'string' 
                ? parseFloat((product.maxPrice as string).replace(/[^0-9.]/g, '')) 
                : product.maxPrice;
            
            // Clean URLs
            const url = product.url.trim();
            const imageUrl = product.imageUrl ? product.imageUrl.trim() : '';
            
            return {
                ...product,
                name,
                brand,
                price,
                minPrice,
                maxPrice,
                url,
                imageUrl,
                lastUpdated: new Date().toISOString()
            };
        });
    }

    /**
     * Validate data completeness and quality
     */
    private validateData(products: ScrapedProduct[]): ScrapedProduct[] {
        return products.filter(product => {
            // Ensure required fields are present
            if (!product.name || !product.price || !product.url) {
                return false;
            }
            
            // Ensure prices are valid numbers
            if (isNaN(product.price) || product.price <= 0) {
                return false;
            }
            
            if (isNaN(product.minPrice) || product.minPrice <= 0) {
                return false;
            }
            
            if (isNaN(product.maxPrice) || product.maxPrice <= 0) {
                return false;
            }
            
            // Additional custom validation can be added here
            
            return true;
        });
    }

    /**
     * Enhance data with derived or additional information
     */
    private enhanceData(products: ScrapedProduct[]): ScrapedProduct[] {
        return products.map(product => {
            // Ensure minPrice and maxPrice are set properly
            const minPrice = Math.min(product.price, product.minPrice);
            const maxPrice = Math.max(product.price, product.maxPrice);
            
            // Calculate additional fields or enrich with extra data
            // For example, you could set a "popularity" score based on price trends
            // or add additional metadata
            
            return {
                ...product,
                minPrice,
                maxPrice
            };
        });
    }

    /**
     * Detect price and availability anomalies
     */
    private detectAnomalies(products: ScrapedProduct[], storeId: string): ScrapedProduct[] {
        // Price thresholds for different types of products
        const priceThresholds: Record<string, { min: number; max: number }> = {
            'aeg': { min: 100, max: 1000 },
            'gbbr': { min: 150, max: 1200 },
            'gbb_pistol': { min: 80, max: 500 },
            'spring': { min: 20, max: 400 },
            'hpa': { min: 300, max: 1800 },
            'default': { min: 50, max: 800 }
        };

        return products.map(product => {
            let hasAnomaly = false;
            const threshold = priceThresholds[product.type] || priceThresholds.default;
            
            // Check for price anomalies
            if (product.price < threshold.min) {
                console.warn(`Anomaly detected: ${product.name} price (${product.price}) below typical minimum (${threshold.min})`);
                hasAnomaly = true;
                
                // Record anomaly metric
                this.monitoring.recordMetric('price_anomaly', product.price, { 
                    store: storeId, 
                    product: product.name,
                    type: 'below_min'
                });
            }
            
            if (product.price > threshold.max) {
                console.warn(`Anomaly detected: ${product.name} price (${product.price}) above typical maximum (${threshold.max})`);
                hasAnomaly = true;
                
                // Record anomaly metric
                this.monitoring.recordMetric('price_anomaly', product.price, { 
                    store: storeId, 
                    product: product.name,
                    type: 'above_max'
                });
            }
            
            // Flag the product with the anomaly but don't remove it
            return {
                ...product,
                hasAnomaly
            };
        });
    }

    /**
     * Standardize data formats
     */
    private standardizeFormats(products: ScrapedProduct[]): ScrapedProduct[] {
        return products.map(product => {
            // Ensure consistent date format
            const lastUpdated = new Date().toISOString();
            
            // Normalize brand names to a common format
            let brand = product.brand.trim();
            
            // Standardize common brand name variations
            const brandMapping: Record<string, string> = {
                'tokyo marui': 'Tokyo Marui',
                'tm': 'Tokyo Marui',
                'g&g': 'G&G Armament',
                'g & g': 'G&G Armament',
                'kwa': 'KWA',
                'elite force': 'Elite Force',
                'vfc': 'Elite Force', // VFC is often labeled as Elite Force in US market
                'cyma': 'CYMA',
                'lancer tactical': 'Lancer Tactical',
                'lancer': 'Lancer Tactical',
                'we': 'WE-Tech',
                'we-tech': 'WE-Tech',
                'krytac': 'Krytac',
                'ics': 'ICS',
                'kj works': 'KJ Works',
                'kjw': 'KJ Works',
                'ares': 'Ares',
                'golden eagle': 'Golden Eagle',
                'jag arms': 'JAG Arms'
            };
            
            // Check if we have a standardized name for this brand
            const lowerBrand = brand.toLowerCase();
            for (const [key, value] of Object.entries(brandMapping)) {
                if (lowerBrand.includes(key)) {
                    brand = value;
                    break;
                }
            }
            
            return {
                ...product,
                brand,
                lastUpdated
            };
        });
    }
} 
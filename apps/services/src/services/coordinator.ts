import cron from 'node-cron';
import { BaseScraper } from '../scrapers/base';
import { PriceUpdater } from './updater';
import { ProductMatcher } from './matcher';
import { MonitoringService } from './monitoring';
import { supabase } from '../db/supabase';
import { ScrapedProduct } from '../types';

// Available stores for scraping
export const STORES = {
  EVIKE: 'evike',
  REDWOLF: 'redwolf',
  AIRSOFT_GI: 'airsoftgi',
  AIRSOFT_STATION: 'airsoftstation',
  AIRSOFT_MEGASTORE: 'megastore',
  AIRSOFT_EXTREME: 'extreme'
};

// Agent operation statuses
export const OPERATION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

interface AgentJob {
  agentName: string;
  targetStore: string;
  operationType: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  itemsProcessed?: number;
  itemsUpdated?: number;
  itemsNew?: number;
  errorMessage?: string;
}

interface ScrapeResult {
  products: ScrapedProduct[];
  timestamp: string;
  store: string;
}

export class AgentCoordinator {
  private scrapers: Map<string, BaseScraper>;
  private matcher: ProductMatcher;
  private updater: PriceUpdater;
  private monitoring: MonitoringService;
  private activeJobs: Map<string, AgentJob>;
  private cronJobs: Map<string, cron.ScheduledTask>;
  private scrapeResults: Map<string, ScrapeResult>;

  constructor(monitoring: MonitoringService) {
    this.scrapers = new Map();
    this.matcher = new ProductMatcher();
    this.monitoring = monitoring;
    this.updater = new PriceUpdater(this.matcher, this.monitoring);
    this.activeJobs = new Map();
    this.cronJobs = new Map();
    this.scrapeResults = new Map();
    
    // Create the agent_operations table if it doesn't exist
    this.initDatabase();
  }

  private async initDatabase() {
    // Check if the table exists, create if not
    const { error } = await supabase.rpc('check_and_create_agent_tables');
    if (error) {
      console.error('Error initializing agent tables:', error);
      this.monitoring.recordMetric('database_init_error', 1, { error: error.message });
    }
  }

  /**
   * Register a scraper to be managed by the coordinator
   */
  registerScraper(storeName: string, scraper: BaseScraper) {
    this.scrapers.set(storeName, scraper);
    console.log(`Registered scraper for ${storeName}`);
    this.monitoring.recordMetric('scraper_registered', 1, { store: storeName });
  }

  /**
   * Schedule a scraping job to run on a cron schedule
   */
  scheduleScraping(storeName: string, cronSchedule: string) {
    if (!this.scrapers.has(storeName)) {
      const error = `No scraper registered for ${storeName}`;
      console.error(error);
      this.monitoring.recordMetric('scheduling_error', 1, { store: storeName, error });
      throw new Error(error);
    }

    const job = cron.schedule(cronSchedule, () => {
      this.runScraping(storeName);
    });

    this.cronJobs.set(storeName, job);
    console.log(`Scheduled scraping for ${storeName} with schedule: ${cronSchedule}`);
    this.monitoring.recordMetric('scraper_scheduled', 1, { store: storeName, schedule: cronSchedule });
  }

  /**
   * Run scraping for a specific store
   */
  async runScraping(storeName: string) {
    if (!this.scrapers.has(storeName)) {
      const error = `No scraper registered for ${storeName}`;
      console.error(error);
      this.monitoring.recordMetric('scraping_error', 1, { store: storeName, error });
      throw new Error(error);
    }

    // Check if there's already a running job for this store
    const jobKey = `scrape-${storeName}`;
    if (this.activeJobs.has(jobKey) && 
        this.activeJobs.get(jobKey)!.status === OPERATION_STATUS.RUNNING) {
      console.log(`Scraping for ${storeName} is already running`);
      this.monitoring.recordMetric('scraping_skipped', 1, { store: storeName, reason: 'already_running' });
      return;
    }

    // Create and register the job
    const job: AgentJob = {
      agentName: `${storeName}Scraper`,
      targetStore: storeName,
      operationType: 'scrape',
      status: OPERATION_STATUS.RUNNING,
      startTime: new Date(),
    };
    
    this.activeJobs.set(jobKey, job);
    await this.recordJobStart(job);
    
    // Start monitoring for this operation
    this.monitoring.recordOperationStart('scraping', { store: storeName });

    try {
      console.log(`Starting scrape for ${storeName}`);
      const scraper = this.scrapers.get(storeName)!;
      
      // Track scraping time
      const startTime = Date.now();
      const products = await scraper.getProducts();
      const scrapingTime = Date.now() - startTime;
      
      // Store the scrape results
      this.scrapeResults.set(storeName, {
        products,
        timestamp: new Date().toISOString(),
        store: storeName
      });
      
      this.monitoring.recordMetric('scraping_time', scrapingTime, { store: storeName });
      this.monitoring.recordMetric('products_scraped', products.length, { store: storeName });
      
      // Update job stats before updating prices
      job.itemsProcessed = products.length;
      
      // Update prices in database
      await this.updater.updatePrices(products);
      
      // Complete the job
      job.status = OPERATION_STATUS.COMPLETED;
      job.endTime = new Date();
      job.itemsUpdated = products.length; // Will be refined by the updater
      await this.recordJobCompletion(job);
      
      // Finalize monitoring
      this.monitoring.recordOperationEnd('scraping', { store: storeName });
      this.monitoring.recordOperationStatus('scraping', true, { store: storeName });
      
      console.log(`Completed scraping for ${storeName}, processed ${products.length} products`);
    } catch (error) {
      // Handle job failure
      job.status = OPERATION_STATUS.FAILED;
      job.endTime = new Date();
      job.errorMessage = error instanceof Error ? error.message : String(error);
      await this.recordJobFailure(job);
      
      // Record failure in monitoring
      this.monitoring.recordOperationEnd('scraping', { store: storeName });
      this.monitoring.recordOperationStatus('scraping', false, { store: storeName });
      this.monitoring.recordMetric('scraping_error', 1, { 
        store: storeName, 
        error: job.errorMessage
      });
      
      console.error(`Error scraping ${storeName}:`, error);
    } finally {
      this.activeJobs.delete(jobKey);
    }
  }

  /**
   * Schedule all registered scrapers
   */
  scheduleAllScrapers(cronSchedule: string = '0 */6 * * *') {
    for (const storeName of this.scrapers.keys()) {
      this.scheduleScraping(storeName, cronSchedule);
    }
  }

  /**
   * Run all scrapers immediately
   */
  async runAllScrapers() {
    const promises = Array.from(this.scrapers.keys()).map(store => 
      this.runScraping(store)
    );
    await Promise.all(promises);
  }

  /**
   * Wait for all scraping operations to complete
   */
  async waitForAllOperations(): Promise<void> {
    // Check if there are any running jobs
    const runningJobs = Array.from(this.activeJobs.values())
      .filter(job => job.status === OPERATION_STATUS.RUNNING);
    
    if (runningJobs.length === 0) {
      return;
    }
    
    // Wait for running jobs to complete (max 10 minutes)
    const timeoutMs = 10 * 60 * 1000;
    const pollIntervalMs = 5000;
    const maxIterations = timeoutMs / pollIntervalMs;
    let iterations = 0;
    
    while (iterations < maxIterations) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const stillRunning = Array.from(this.activeJobs.values())
        .filter(job => job.status === OPERATION_STATUS.RUNNING);
      
      if (stillRunning.length === 0) {
        return;
      }
      
      iterations++;
    }
    
    throw new Error('Timed out waiting for scraping operations to complete');
  }

  /**
   * Get the latest scrape results for a specific store
   */
  async getLatestScrapeResults(storeName: string): Promise<ScrapeResult | null> {
    // Check if we have results in memory
    if (this.scrapeResults.has(storeName)) {
      return this.scrapeResults.get(storeName)!;
    }
    
    // If not in memory, try running the scraper to get fresh results
    if (this.scrapers.has(storeName)) {
      const scraper = this.scrapers.get(storeName)!;
      try {
        console.log(`No cached results for ${storeName}, fetching fresh data...`);
        const products = await scraper.getProducts();
        
        const result: ScrapeResult = {
          products,
          timestamp: new Date().toISOString(),
          store: storeName
        };
        
        // Cache the results
        this.scrapeResults.set(storeName, result);
        return result;
      } catch (error) {
        console.error(`Error fetching products for ${storeName}:`, error);
        throw error;
      }
    }
    
    return null;
  }

  /**
   * Get the names of all registered stores
   */
  async getAllStoreNames(): Promise<string[]> {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Get a registered scraper by store name
   */
  getRegisteredScraper(storeName: string): BaseScraper | undefined {
    return this.scrapers.get(storeName);
  }

  /**
   * Record job start in the database
   */
  private async recordJobStart(job: AgentJob) {
    try {
      await supabase
        .from('agent_operations')
        .insert({
          agent_name: job.agentName,
          operation_type: job.operationType,
          target_store: job.targetStore,
          status: job.status,
          start_time: job.startTime.toISOString()
        });
    } catch (error) {
      console.error('Error recording job start:', error);
      this.monitoring.recordMetric('database_error', 1, { 
        operation: 'record_job_start',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Record job completion in the database
   */
  private async recordJobCompletion(job: AgentJob) {
    if (!job.endTime) job.endTime = new Date();
    
    try {
      await supabase
        .from('agent_operations')
        .update({
          status: job.status,
          end_time: job.endTime.toISOString(),
          items_processed: job.itemsProcessed || 0,
          items_updated: job.itemsUpdated || 0,
          items_new: job.itemsNew || 0
        })
        .eq('agent_name', job.agentName)
        .eq('operation_type', job.operationType)
        .eq('target_store', job.targetStore)
        .eq('start_time', job.startTime.toISOString());
    } catch (error) {
      console.error('Error recording job completion:', error);
      this.monitoring.recordMetric('database_error', 1, { 
        operation: 'record_job_completion',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Record job failure in the database
   */
  private async recordJobFailure(job: AgentJob) {
    if (!job.endTime) job.endTime = new Date();
    
    try {
      await supabase
        .from('agent_operations')
        .update({
          status: job.status,
          end_time: job.endTime.toISOString(),
          error_message: job.errorMessage
        })
        .eq('agent_name', job.agentName)
        .eq('operation_type', job.operationType)
        .eq('target_store', job.targetStore)
        .eq('start_time', job.startTime.toISOString());
    } catch (error) {
      console.error('Error recording job failure:', error);
      this.monitoring.recordMetric('database_error', 1, { 
        operation: 'record_job_failure',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get recent operation statistics
   */
  async getOperationStats(limit: number = 10) {
    try {
      const { data } = await supabase
        .from('agent_operations')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(limit);
        
      return data;
    } catch (error) {
      console.error('Error getting operation stats:', error);
      this.monitoring.recordMetric('database_error', 1, { 
        operation: 'get_operation_stats',
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }
  
  /**
   * Get the system's overall health status
   */
  async getSystemHealth() {
    // Calculate overall success rate for the past day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const { data: operations } = await supabase
        .from('agent_operations')
        .select('status')
        .gte('start_time', oneDayAgo);
        
      if (!operations || operations.length === 0) {
        return {
          status: 'unknown',
          successRate: null,
          operationCount: 0,
          message: 'No operations recorded in the past 24 hours'
        };
      }
      
      const successfulOps = operations.filter(op => op.status === OPERATION_STATUS.COMPLETED);
      const successRate = successfulOps.length / operations.length;
      
      let status = 'healthy';
      let message = 'System is operating normally';
      
      if (successRate < 0.5) {
        status = 'critical';
        message = 'System is experiencing critical failures';
      } else if (successRate < 0.8) {
        status = 'degraded';
        message = 'System is experiencing some failures';
      }
      
      return {
        status,
        successRate,
        operationCount: operations.length,
        message
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      this.monitoring.recordMetric('database_error', 1, { 
        operation: 'get_system_health',
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        status: 'unknown',
        successRate: null,
        operationCount: 0,
        message: 'Error retrieving system health data'
      };
    }
  }

  /**
   * Get the number of registered scrapers
   */
  getRegisteredScraperCount(): number {
    return this.scrapers.size;
  }

  /**
   * Get the names of all registered scrapers
   */
  getRegisteredScraperNames(): string[] {
    return Array.from(this.scrapers.keys());
  }
} 
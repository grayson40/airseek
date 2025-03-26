import { supabase } from '../db/supabase';

export interface PerformanceMetric {
    metricName: string;
    value: number;
    tags: Record<string, string>;
    timestamp: Date;
}

export interface AlertConfig {
    metricName: string;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq';
    message: string;
}

export class MonitoringService {
    private metrics: PerformanceMetric[] = [];
    private alertConfigs: AlertConfig[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    
    constructor(private flushIntervalMs: number = 60000) {
        // Default alert configurations
        this.alertConfigs = [
            {
                metricName: 'scraping_time',
                threshold: 1800000, // 30 minutes
                operator: 'gt',
                message: 'Scraping operation taking too long'
            },
            {
                metricName: 'error_rate',
                threshold: 0.1, // 10% error rate
                operator: 'gt',
                message: 'High error rate detected'
            },
            {
                metricName: 'product_count',
                threshold: 10, // Fewer than 10 products
                operator: 'lt',
                message: 'Very few products scraped, possible site structure change'
            }
        ];
    }
    
    /**
     * Start the monitoring service
     */
    start() {
        // Set up a periodic flush of metrics to the database
        this.flushInterval = setInterval(() => {
            this.flushMetrics();
        }, this.flushIntervalMs);
        
        console.log('Monitoring service started');
    }
    
    /**
     * Stop the monitoring service
     */
    stop() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        
        console.log('Monitoring service stopped');
    }
    
    /**
     * Record a performance metric
     */
    recordMetric(metricName: string, value: number, tags: Record<string, string> = {}) {
        const metric: PerformanceMetric = {
            metricName,
            value,
            tags,
            timestamp: new Date()
        };
        
        this.metrics.push(metric);
        
        // Check for alerts
        this.checkAlerts(metric);
        
        // Flush metrics if buffer gets too large
        if (this.metrics.length >= 100) {
            this.flushMetrics();
        }
    }
    
    /**
     * Record the start of an operation
     */
    recordOperationStart(operationName: string, tags: Record<string, string> = {}) {
        // Store the start time in memory
        const key = this.getOperationKey(operationName, tags);
        const startTime = Date.now();
        
        // Use localStorage in the browser, or a Map in Node.js
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(key, startTime.toString());
        } else {
            (global as any).__monitoringTimers = (global as any).__monitoringTimers || new Map();
            (global as any).__monitoringTimers.set(key, startTime);
        }
    }
    
    /**
     * Record the end of an operation and calculate duration
     */
    recordOperationEnd(operationName: string, tags: Record<string, string> = {}) {
        const key = this.getOperationKey(operationName, tags);
        const endTime = Date.now();
        let startTime;
        
        // Retrieve the start time
        if (typeof localStorage !== 'undefined') {
            startTime = parseInt(localStorage.getItem(key) || '0', 10);
            localStorage.removeItem(key);
        } else {
            const timers = (global as any).__monitoringTimers;
            if (timers && timers.has(key)) {
                startTime = timers.get(key);
                timers.delete(key);
            }
        }
        
        if (startTime) {
            const duration = endTime - startTime;
            this.recordMetric(`${operationName}_time`, duration, tags);
            return duration;
        }
        
        return 0;
    }
    
    /**
     * Record success or failure of an operation
     */
    recordOperationStatus(operationName: string, success: boolean, tags: Record<string, string> = {}) {
        this.recordMetric(`${operationName}_success`, success ? 1 : 0, tags);
        
        if (!success) {
            this.recordMetric(`${operationName}_error`, 1, tags);
        }
    }
    
    /**
     * Get system-wide error rate over the last hour
     */
    async getErrorRate(): Promise<number> {
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        
        const { data: operations } = await supabase
            .from('agent_operations')
            .select('status')
            .gte('start_time', oneHourAgo);
            
        if (!operations || operations.length === 0) {
            return 0;
        }
        
        const failedOperations = operations.filter(op => op.status === 'failed');
        return failedOperations.length / operations.length;
    }
    
    /**
     * Check if a metric triggers any alerts
     */
    private checkAlerts(metric: PerformanceMetric) {
        for (const alertConfig of this.alertConfigs) {
            if (alertConfig.metricName === metric.metricName) {
                let shouldAlert = false;
                
                if (alertConfig.operator === 'gt' && metric.value > alertConfig.threshold) {
                    shouldAlert = true;
                } else if (alertConfig.operator === 'lt' && metric.value < alertConfig.threshold) {
                    shouldAlert = true;
                } else if (alertConfig.operator === 'eq' && metric.value === alertConfig.threshold) {
                    shouldAlert = true;
                }
                
                if (shouldAlert) {
                    this.triggerAlert(alertConfig, metric);
                }
            }
        }
    }
    
    /**
     * Trigger an alert based on a metric value
     */
    private async triggerAlert(config: AlertConfig, metric: PerformanceMetric) {
        const alert = {
            message: config.message,
            metricName: metric.metricName,
            value: metric.value,
            threshold: config.threshold,
            timestamp: new Date().toISOString(),
            tags: metric.tags
        };
        
        console.error('ALERT:', alert);
        
        // In a real system, you might want to send emails, Slack messages, etc.
        // For now, we just log to console and store in the database
        try {
            await supabase
                .from('monitoring_alerts')
                .insert(alert);
                
            console.log('Alert stored in database');
        } catch (error: unknown) {
            console.error('Error storing alert:', error);
        }
    }
    
    /**
     * Flush metrics to database
     */
    private async flushMetrics() {
        if (this.metrics.length === 0) {
            return;
        }
        
        const metricsToFlush = [...this.metrics];
        this.metrics = []; // Clear buffer
        
        try {
            const formattedMetrics = metricsToFlush.map(metric => ({
                metric_name: metric.metricName,
                value: metric.value,
                tags: metric.tags,
                timestamp: metric.timestamp.toISOString()
            }));
            
            await supabase
                .from('monitoring_metrics')
                .insert(formattedMetrics);
                
            console.log(`Flushed ${metricsToFlush.length} metrics to database`);
        } catch (error: unknown) {
            console.error('Error flushing metrics:', error);
            
            // Put the metrics back in the buffer to try again later
            this.metrics = [...metricsToFlush, ...this.metrics];
        }
    }
    
    /**
     * Generate a unique key for an operation
     */
    private getOperationKey(operationName: string, tags: Record<string, string>): string {
        const tagsString = Object.entries(tags)
            .map(([key, value]) => `${key}=${value}`)
            .join(',');
            
        return `op:${operationName}:${tagsString}`;
    }
} 
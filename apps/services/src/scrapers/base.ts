import type { ScrapedProduct } from "../types";

export abstract class BaseScraper {
    abstract storeName: string;
    abstract baseUrl: string;

    abstract getProducts(): Promise<ScrapedProduct[]>;

    // User agent rotation
    private userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36 Edg/91.0.864.54',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];

    private lastRequestTime = 0;
    private requestCount = 0;
    private maxRequestsPerMinute = 20;
    private retryCount = 0;
    private maxRetries = 3;

    protected async fetch(url: string): Promise<string> {
        this.retryCount = 0;
        return this.fetchWithRetry(url);
    }

    private async fetchWithRetry(url: string): Promise<string> {
        try {
            // Respect rate limits
            await this.respectRateLimit();

            // Use a random user agent
            const userAgent = this.getRandomUserAgent();

            // Track this request
            this.requestCount++;
            this.lastRequestTime = Date.now();

            // Make the request
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }

            // Check for CAPTCHA or bot detection
            const text = await response.text();
            if (this.isCaptchaDetected(text) || this.isBotDetectionPage(text)) {
                throw new Error(`CAPTCHA or bot detection encountered at ${url}`);
            }

            return text;
        } catch (error) {
            // Retry logic
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retry ${this.retryCount}/${this.maxRetries} for ${url}`);
                
                // Add an exponential backoff
                const backoff = Math.pow(2, this.retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoff));
                
                // Try again
                return this.fetchWithRetry(url);
            }
            
            throw error;
        }
    }

    private async respectRateLimit(): Promise<void> {
        // Reset request count after a minute
        const now = Date.now();
        if (now - this.lastRequestTime > 60000) {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }

        // Check if we need to throttle
        if (this.requestCount >= this.maxRequestsPerMinute) {
            const timeToWait = 60000 - (now - this.lastRequestTime);
            if (timeToWait > 0) {
                console.log(`Rate limit reached, waiting ${timeToWait}ms before next request`);
                await new Promise(resolve => setTimeout(resolve, timeToWait));
            }
            this.requestCount = 0;
            this.lastRequestTime = Date.now();
        }

        // Add random delay between requests (1-5 seconds)
        const randomDelay = 1000 + Math.random() * 4000;
        await new Promise(resolve => setTimeout(resolve, randomDelay));
    }

    private getRandomUserAgent(): string {
        const randomIndex = Math.floor(Math.random() * this.userAgents.length);
        return this.userAgents[randomIndex];
    }

    private isCaptchaDetected(html: string): boolean {
        const lowerHtml = html.toLowerCase();
        return (
            lowerHtml.includes('captcha') ||
            lowerHtml.includes('recaptcha') ||
            lowerHtml.includes('robot check')
        );
    }

    private isBotDetectionPage(html: string): boolean {
        const lowerHtml = html.toLowerCase();
        return (
            lowerHtml.includes('bot detected') ||
            lowerHtml.includes('automated access') ||
            lowerHtml.includes('suspicious activity') ||
            lowerHtml.includes('unusual traffic')
        );
    }
}
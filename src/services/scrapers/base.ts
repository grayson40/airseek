import type { ScrapedProduct } from "../../types";

export abstract class BaseScraper {
    abstract storeName: string;
    abstract baseUrl: string;

    abstract getProducts(): Promise<ScrapedProduct[]>;

    protected async fetch(url: string): Promise<string> {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        // Add a delay to avoid hitting the server too quickly
        await new Promise(resolve => setTimeout(resolve, 2000));

        return await response.text();
    }
}
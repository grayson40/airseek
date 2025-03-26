"use client";

import React, { useState } from 'react';

interface ScraperControlsProps {
  stores: string[];
}

export default function ScraperControls({ stores }: ScraperControlsProps) {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });

  const triggerAction = async (action: 'scrape' | 'import') => {
    const loadingKey = `${action}_${selectedStore}`;
    
    try {
      setIsLoading(prev => ({ ...prev, [loadingKey]: true }));
      setMessage({ text: '', type: null });
      
      const store = selectedStore === 'all' ? '' : selectedStore;
      const response = await fetch(`/api/admin/scrapers?action=${action}&store=${store}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to perform action');
      }
      
      setMessage({ 
        text: data.message || `${action.charAt(0).toUpperCase() + action.slice(1)} operation started successfully`, 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ 
        text: error instanceof Error ? error.message : 'An unknown error occurred', 
        type: 'error' 
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [loadingKey]: false }));
      
      // Clear success message after 5 seconds
      if (message.type === 'success') {
        setTimeout(() => {
          setMessage(prev => prev.type === 'success' ? { text: '', type: null } : prev);
        }, 5000);
      }
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <label htmlFor="store-select" className="block text-sm font-medium text-slate-700 mb-2">
          Select Store
        </label>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setSelectedStore('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              selectedStore === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Stores
          </button>
          
          {stores.map(store => (
            <button
              key={store}
              type="button"
              onClick={() => setSelectedStore(store)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedStore === store
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => triggerAction('scrape')}
          disabled={isLoading['scrape_' + selectedStore]}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading['scrape_' + selectedStore] ? 'Starting Scrape...' : 'Start Scraping'}
        </button>
        
        <button
          type="button"
          onClick={() => triggerAction('import')}
          disabled={isLoading['import_' + selectedStore]}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading['import_' + selectedStore] ? 'Importing...' : 'Import Products'}
        </button>
      </div>
      
      {message.text && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mt-6 text-sm text-slate-500">
        <h3 className="font-medium text-slate-700 mb-2">Instructions:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Start Scraping:</strong> Starts the scraping process for the selected store (or all stores)</li>
          <li><strong>Import Products:</strong> Imports the most recently scraped products into the database</li>
          <li>Select a specific store or &quot;All Stores&quot; to perform operations on multiple stores at once</li>
          <li>Operations may take several minutes to complete, especially for all stores</li>
        </ul>
      </div>
    </div>
  );
} 
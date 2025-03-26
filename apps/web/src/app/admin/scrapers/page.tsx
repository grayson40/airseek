import React from 'react';
import ScraperControls from '../../../components/admin/ScraperControls';

async function getScraperHealth() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/admin/scrapers?endpoint=health`, {
      cache: 'no-store' // Don't cache this data
    });
    
    if (!response.ok) {
      console.error('Error fetching scraper health:', response.statusText);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scraper health:', error);
    return null;
  }
}

async function getOperationStats() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/admin/scrapers?endpoint=stats`, {
      cache: 'no-store' // Don't cache this data
    });
    
    if (!response.ok) {
      console.error('Error fetching operation stats:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    return data.operations || [];
  } catch (error) {
    console.error('Error fetching operation stats:', error);
    return [];
  }
}

export default async function ScrapersPage() {
  const health = await getScraperHealth();
  const operations = await getOperationStats();
  
  const stores = health?.registeredScrapers || ['evike', 'redwolf', 'airsoftgi', 'airsoftstation'];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Scraper Management</h1>
      </div>
      
      {/* System Health Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
        </div>
        <div className="p-6">
          {health ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-xl font-semibold text-slate-900">
                  {health.status === 'healthy' ? (
                    <span className="text-green-600">Healthy</span>
                  ) : (
                    <span className="text-red-600">Unhealthy</span>
                  )}
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Registered Scrapers</p>
                <p className="text-xl font-semibold text-slate-900">{health.registeredScrapers?.length || 0}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Active Operations</p>
                <p className="text-xl font-semibold text-slate-900">{health.activeOperations || 0}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-red-600">
                Could not connect to scraper services. Ensure the services are running on port 8000.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Scraper Controls */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Scraper Controls</h2>
        </div>
        <div className="p-6">
          <ScraperControls stores={stores} />
        </div>
      </div>
      
      {/* Recent Operations */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Operations</h2>
        </div>
        <div className="p-6">
          {operations && operations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Items Processed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {operations.map((op: any) => (
                    <tr key={op.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {op.target_store}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {op.operation_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={op.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {op.items_processed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {op.end_time ? new Date(op.end_time).toLocaleString() : 'Not completed'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {calculateDuration(op)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 italic">No recent operations</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colorClass;
  
  switch (status?.toLowerCase()) {
    case 'completed':
      colorClass = 'bg-green-100 text-green-800 border border-green-200';
      break;
    case 'running':
      colorClass = 'bg-blue-100 text-blue-800 border border-blue-200';
      break;
    case 'failed':
      colorClass = 'bg-red-100 text-red-800 border border-red-200';
      break;
    case 'pending':
      colorClass = 'bg-amber-100 text-amber-800 border border-amber-200';
      break;
    default:
      colorClass = 'bg-slate-100 text-slate-800 border border-slate-200';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  );
}

function calculateDuration(operation: any) {
  if (!operation.start_time) {
    return 'Not started';
  }
  
  if (!operation.end_time) {
    if (operation.status?.toLowerCase() === 'running') {
      // Calculate time elapsed since start
      const startTime = new Date(operation.start_time).getTime();
      const now = new Date().getTime();
      const durationMs = now - startTime;
      return formatDuration(durationMs) + ' (ongoing)';
    }
    return 'Not completed';
  }
  
  const startTime = new Date(operation.start_time).getTime();
  const endTime = new Date(operation.end_time).getTime();
  const durationMs = endTime - startTime;
  
  return formatDuration(durationMs);
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
} 
import React from 'react';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';

// Mark page as dynamic
export const dynamic = 'force-dynamic';

interface DashboardStats {
  productCount: number;
  storeCount: number;
  operationsCount: number;
  lastOperation: any;
  recentMetrics: any[];
}

interface Store {
  store_name: string;
}

interface Product {
  stores: Store[];
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  noStore(); // Opt out of static rendering
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
  
  // Fetch product count
  const productsResponse = await fetch(`${baseUrl}/api/admin/products?limit=1`, { 
    cache: 'no-store'
  });
  const productsData = await productsResponse.json();
  
  // Fetch operations with limit 1 to get the most recent
  const operationsResponse = await fetch(`${baseUrl}/api/admin/operations?limit=1`, {
    cache: 'no-store'
  });
  const operationsData = await operationsResponse.json();
  
  // Fetch metrics
  const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics?limit=5`, {
    cache: 'no-store'
  });
  const metricsData = await metricsResponse.json();
  
  // Get store count (unique store names) from the products data
  const uniqueStores = new Set<string>();
  productsData.data?.forEach((product: Product) => {
    if (product.stores && product.stores.length) {
      product.stores.forEach((store: Store) => uniqueStores.add(store.store_name));
    }
  });
  
  return {
    productCount: productsData.count || 0,
    storeCount: uniqueStores.size || 0,
    operationsCount: operationsData.count || 0,
    lastOperation: operationsData.data?.[0] || null,
    recentMetrics: metricsData.latest || [],
  };
}

export default async function AdminDashboard() {
  const stats = await fetchDashboardStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8 text-slate-900">Dashboard Overview</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Products" 
          value={stats.productCount} 
          description="Total products tracked"
          href="/admin/products"
        />
        <StatsCard 
          title="Stores" 
          value={stats.storeCount} 
          description="Stores integrated"
          href="/admin/operations" 
        />
        <StatsCard 
          title="Operations" 
          value={stats.operationsCount} 
          description="Total agent operations"
          href="/admin/operations" 
        />
        <StatsCard 
          title="Last Updated" 
          value={stats.lastOperation ? new Date(stats.lastOperation.created_at).toLocaleDateString() : 'N/A'} 
          description={stats.lastOperation ? `${stats.lastOperation.agent_name} ${stats.lastOperation.status}` : 'No operations'} 
          href="/admin/operations"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Operations */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Recent Operations</h2>
            <Link href="/admin/operations" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all
            </Link>
          </div>
          
          <div className="p-4">
            <RecentOperations />
          </div>
        </div>
        
        {/* Recent Metrics */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex justify-between items-center p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Monitoring Metrics</h2>
            <Link href="/admin/monitoring" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all
            </Link>
          </div>
          
          <div className="p-4">
            <MonitoringMetrics metrics={stats.recentMetrics} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, description, href }: { 
  title: string, 
  value: string | number, 
  description: string,
  href: string
}) {
  return (
    <Link 
      href={href}
      className="bg-white border border-slate-200 p-6 rounded-lg hover:border-slate-300 transition-colors"
    >
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-2xl font-semibold mt-2 mb-1 text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}

interface Operation {
  id: string;
  agent_name: string;
  operation_type: string;
  status: string;
  created_at: string;
}

async function RecentOperations() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
  const response = await fetch(`${baseUrl}/api/admin/operations?limit=5`, {
    next: { revalidate: 60 } // Cache for 1 minute
  });
  const { data: operations } = await response.json();

  if (!operations || operations.length === 0) {
    return <p className="text-slate-500 italic">No recent operations</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {operations.map((op: Operation) => (
            <tr key={op.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap text-slate-900">{op.agent_name}</td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">{op.operation_type}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={op.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                {new Date(op.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    completed: "bg-green-100 text-green-800 border border-green-200",
    running: "bg-blue-100 text-blue-800 border border-blue-200",
    failed: "bg-red-100 text-red-800 border border-red-200",
    pending: "bg-amber-100 text-amber-800 border border-amber-200",
  };
  
  const style = statusStyles[status.toLowerCase()] || "bg-slate-100 text-slate-800 border border-slate-200";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

interface Metric {
  id: string;
  metric_name: string;
  value: number;
  created_at: string;
}

async function MonitoringMetrics({ metrics }: { metrics: Metric[] }) {
  if (!metrics || metrics.length === 0) {
    return <p className="text-slate-500 italic">No metrics available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {metrics.map((metric) => (
            <tr key={metric.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 whitespace-nowrap text-slate-900">{metric.metric_name}</td>
              <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">{metric.value}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                {new Date(metric.created_at).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
import React from 'react';

interface MetricData {
  id: string;
  metric_name: string;
  value: number;
  created_at: string;
  metadata: any;
}

interface GroupedMetrics {
  [key: string]: {
    values: number[];
    timestamps: string[];
  };
}

async function getMonitoringMetrics(): Promise<MetricData[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/metrics?timeframe=7d&limit=500`, {
    next: { revalidate: 300 } // Cache for 5 minutes
  });
  
  if (!response.ok) {
    console.error('Error fetching monitoring metrics:', response.statusText);
    return [];
  }
  
  const data = await response.json();
  return data.metrics || [];
}

function groupMetricsByName(metrics: MetricData[]): GroupedMetrics {
  const grouped: GroupedMetrics = {};

  metrics.forEach(metric => {
    if (!grouped[metric.metric_name]) {
      grouped[metric.metric_name] = {
        values: [],
        timestamps: []
      };
    }

    grouped[metric.metric_name].values.unshift(metric.value);
    grouped[metric.metric_name].timestamps.unshift(metric.created_at);
  });

  return grouped;
}

export default async function MonitoringPage() {
  const metrics = await getMonitoringMetrics();
  const groupedMetrics = groupMetricsByName(metrics);
  
  // Get the latest values for key metrics to display at the top
  const latestMetrics = Object.keys(groupedMetrics).map(name => {
    const latest = metrics.find(m => m.metric_name === name);
    return {
      name,
      value: latest?.value || 0,
      timestamp: latest?.created_at || ''
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-8 text-slate-900">Monitoring & Metrics</h1>
      
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {latestMetrics.slice(0, 4).map((metric) => (
          <div key={metric.name} className="bg-white border border-slate-200 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-slate-500">{formatMetricName(metric.name)}</h3>
            <p className="text-2xl font-semibold mt-2 mb-1 text-slate-900">{metric.value}</p>
            <p className="text-sm text-slate-600">
              Last updated: {formatDateTime(metric.timestamp)}
            </p>
          </div>
        ))}
      </div>
      
      {/* Metric Charts */}
      <div className="space-y-8">
        {Object.entries(groupedMetrics).map(([metricName, data]) => (
          <div key={metricName} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">{formatMetricName(metricName)}</h2>
            </div>
            
            <div className="p-6">
              <div className="h-64 relative">
                <MetricChart 
                  values={data.values} 
                  timestamps={data.timestamps.map(formatDateTime)} 
                />
              </div>
              
              {/* Metric Stats */}
              <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-500">Latest</p>
                  <p className="font-semibold text-slate-900">{data.values[data.values.length - 1]}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Average</p>
                  <p className="font-semibold text-slate-900">{calculateAverage(data.values)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Min</p>
                  <p className="font-semibold text-slate-900">{Math.min(...data.values)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Max</p>
                  <p className="font-semibold text-slate-900">{Math.max(...data.values)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricChart({ values, timestamps }: { values: number[], timestamps: string[] }) {
  // This is a simplified chart visualization
  // In a real implementation, you'd use a charting library like Chart.js, Recharts, etc.
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="h-full flex items-end space-x-1">
      {values.map((value, index) => {
        const height = ((value - min) / range) * 100;
        const heightPercent = Math.max(5, height); // Ensure at least 5% height for visibility
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-blue-600 rounded-t"
              style={{ height: `${heightPercent}%` }}
              title={`${value} - ${timestamps[index]}`}
            ></div>
            {index % Math.ceil(values.length / 10) === 0 && (
              <div className="text-xs text-slate-500 mt-1 truncate max-w-[30px] rotate-45 origin-top-left">
                {timestamps[index].split(' ')[0]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function formatMetricName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
} 
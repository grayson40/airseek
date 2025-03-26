import React from 'react';
import Link from 'next/link';

interface Operation {
  id: string;
  agent_name: string;
  operation_type: string;
  target_store: string;
  status: string;
  items_processed: number;
  items_updated: number;
  items_new: number;
  start_time: string;
  end_time: string;
  error_message: string;
  created_at: string;
  metadata: any;
}

async function getOperationDetails(id: string): Promise<Operation | null> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/operations/${id}`, {
    next: { revalidate: 60 } // Cache for 1 minute
  });
  
  if (!response.ok) {
    console.error(`Error fetching operation ${id}:`, response.statusText);
    return null;
  }
  
  const data = await response.json();
  return data.operation;
}

// Define the proper type for page params in Next.js App Router
type Props = Promise<{ id: string }>;

export default async function OperationDetailPage(props: { params: Props }) {
  const { id } = await props.params;
  const operation = await getOperationDetails(id);

  if (!operation) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-red-600">Operation Not Found</h1>
        <p className="mt-4 text-slate-600">The operation you are looking for doesn&apos;t exist or was removed.</p>
        <Link href="/admin/operations" className="mt-6 inline-block text-blue-600 hover:text-blue-800 font-medium">
          Return to Operations List
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/operations" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Operations
          </Link>
          <h1 className="text-2xl font-semibold mt-2 text-slate-900">Operation Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* Operation Overview */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Operation Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Agent</p>
                  <p className="font-medium text-slate-900">{operation.agent_name}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Operation Type</p>
                  <p className="font-medium text-slate-900">{operation.operation_type}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <StatusBadge status={operation.status} />
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Target Store</p>
                  <p className="font-medium text-slate-900">{operation.target_store}</p>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Created</p>
                  <p className="font-medium text-slate-900">{operation.created_at ? new Date(operation.created_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Start Time</p>
                  <p className="font-medium text-slate-900">{operation.start_time ? new Date(operation.start_time).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">End Time</p>
                  <p className="font-medium text-slate-900">{operation.end_time ? new Date(operation.end_time).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Duration</p>
                  <p className="font-medium text-slate-900">{calculateDuration(operation)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Processing Results */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Processing Results</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Items Processed</p>
                <p className="text-2xl font-semibold text-slate-900">{operation.items_processed || 0}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Items Updated</p>
                <p className="text-2xl font-semibold text-slate-900">{operation.items_updated || 0}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">New Items</p>
                <p className="text-2xl font-semibold text-slate-900">{operation.items_new || 0}</p>
              </div>
            </div>
            
            {operation.error_message && (
              <div className="mt-6">
                <p className="text-sm text-slate-500 mb-1">Error Message</p>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
                  {operation.error_message}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Operation Metadata */}
        {operation.metadata && Object.keys(operation.metadata).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Operation Metadata</h2>
            </div>
            <div className="p-6">
              <pre className="bg-slate-50 rounded-lg p-4 overflow-x-auto text-sm text-slate-800">
                {JSON.stringify(operation.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let colorClass;
  
  switch (status.toLowerCase()) {
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
      {status}
    </span>
  );
}

function calculateDuration(operation: Operation) {
  if (!operation.start_time) {
    return 'Not started';
  }
  
  if (!operation.end_time) {
    if (operation.status.toLowerCase() === 'running') {
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
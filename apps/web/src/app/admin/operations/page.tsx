import React from 'react';
import Link from 'next/link';
import { RefreshButton } from '../../../components/admin/ClientButtons';

interface Operation {
  id: string;
  agent_name: string;
  operation_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  metadata: any;
  error_message: string | null;
}

async function getOperations(): Promise<Operation[]> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/admin/operations?limit=50`, {
    next: { revalidate: 60 } // Cache for 1 minute
  });
  
  if (!response.ok) {
    console.error('Error fetching operations:', response.statusText);
    return [];
  }
  
  const { data } = await response.json();
  return data as Operation[] || [];
}

export default async function OperationsPage() {
  const operations = await getOperations();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Agent Operations</h1>
        <div className="flex gap-2">
          <RefreshButton />
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Agent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Completed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-slate-500">
                    No operations found
                  </td>
                </tr>
              ) : (
                operations.map((operation) => (
                  <tr key={operation.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {operation.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {operation.operation_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={operation.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(operation.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {operation.completed_at 
                        ? new Date(operation.completed_at).toLocaleString() 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {calculateDuration(operation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/admin/operations/${operation.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
  if (!operation.completed_at) {
    if (operation.status.toLowerCase() === 'running') {
      // Calculate time elapsed since creation
      const startTime = new Date(operation.created_at).getTime();
      const now = new Date().getTime();
      const durationMs = now - startTime;
      return formatDuration(durationMs) + ' (ongoing)';
    }
    return '-';
  }
  
  const startTime = new Date(operation.created_at).getTime();
  const endTime = new Date(operation.completed_at).getTime();
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
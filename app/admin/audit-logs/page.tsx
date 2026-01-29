'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_values: Record<string, any>;
  after_values: Record<string, any>;
  description: string;
  created_at: string;
  ip_address?: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    resourceType: 'all',
    action: 'all',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (filters.resourceType !== 'all') {
        params.append('resource_type', filters.resourceType);
      }
      if (filters.action !== 'all') {
        params.append('action', filters.action);
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load audit logs');
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const response = await fetch('/api/admin/audit-logs/export', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  const getActionBadge = (action: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (action.toLowerCase()) {
      case 'create':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'update':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'delete':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'approve':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const DetailModal = ({ log, onClose }: { log: AuditLog; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Audit Log Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Action</p>
                <p className="text-gray-900 mt-1">{log.action}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Resource</p>
                <p className="text-gray-900 mt-1">{log.resource_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">User</p>
                <p className="text-gray-900 mt-1 text-sm">{log.user_email || log.user_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">Timestamp</p>
                <p className="text-gray-900 mt-1">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {log.ip_address && (
              <div>
                <p className="text-xs text-gray-600 uppercase font-medium">IP Address</p>
                <p className="text-gray-900 mt-1 font-mono text-sm">{log.ip_address}</p>
              </div>
            )}

            {Object.keys(log.before_values).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Before Values</h3>
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <pre className="text-red-800 whitespace-pre-wrap break-words">
                    {JSON.stringify(log.before_values, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {Object.keys(log.after_values).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">After Values</h3>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <pre className="text-green-800 whitespace-pre-wrap break-words">
                    {JSON.stringify(log.after_values, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const totalPages = Math.ceil(totalLogs / 10);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">Track all system changes and administrative actions</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters and Export */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Resource Type Filter */}
            <select
              value={filters.resourceType}
              onChange={e =>
                setFilters({ ...filters, resourceType: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
            >
              <option value="all">All Resources</option>
              <option value="prescriptions">Prescriptions</option>
              <option value="refill_requests">Refill Requests</option>
              <option value="orders">Orders</option>
              <option value="users">Users</option>
              <option value="inventory">Inventory</option>
              <option value="settings">Settings</option>
            </select>

            {/* Action Filter */}
            <select
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
            >
              <option value="all">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition ml-auto"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="text-xs">{log.user_email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={getActionBadge(log.action)}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.resource_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages} ({totalLogs} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 hover:bg-white"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </div>
    </div>
  );
}

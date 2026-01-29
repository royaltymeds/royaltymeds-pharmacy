'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface TransactionStats {
  total_transactions: number;
  total_revenue: number;
  average_transaction: number;
  total_refunds: number;
  total_adjustments: number;
  completed_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
}

interface Transaction {
  id: string;
  patient_id: string;
  patient_email?: string;
  patient_name?: string;
  order_id: string | null;
  transaction_type: 'order' | 'refund' | 'adjustment' | 'payment';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  notes: string | null;
}

export default function AdminTransactionDashboardPage() {
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, [dateRange, page]);

  const loadData = async () => {
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

      // Load stats
      const statsResponse = await fetch(`/api/admin/transactions/stats?period=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load transactions
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        period: dateRange,
      });

      const transResponse = await fetch(`/api/admin/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!transResponse.ok) throw new Error('Failed to load transactions');
      const transData = await transResponse.json();
      setTransactions(transData.transactions || []);
      setTotalTransactions(transData.total || 0);
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

      const response = await fetch(`/api/admin/transactions/export?period=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return baseClasses;
    }
  };

  const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-600 uppercase">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );

  const totalPages = Math.ceil(totalTransactions / 20);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Dashboard</h1>
          <p className="text-gray-600">Monitor system-wide financial transactions</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            {(['7days', '30days', '90days', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded font-medium transition ${
                  dateRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                }`}
              >
                {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : range === '90days' ? '90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Transactions"
              value={stats.total_transactions}
              subtext={`Revenue: $${stats.total_revenue.toFixed(2)}`}
            />
            <StatCard
              label="Average Transaction"
              value={`$${stats.average_transaction.toFixed(2)}`}
              subtext="Per transaction"
            />
            <StatCard
              label="Completed"
              value={stats.completed_transactions}
              subtext={`Refunds: ${stats.total_refunds}`}
            />
            <StatCard
              label="Pending/Failed"
              value={stats.pending_transactions + stats.failed_transactions}
              subtext={`Pending: ${stats.pending_transactions}, Failed: ${stats.failed_transactions}`}
            />
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No transactions found for the selected period</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900">{transaction.patient_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{transaction.patient_email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={getStatusBadge(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {transaction.order_id ? (
                            <Link
                              href={`/admin/orders/${transaction.order_id}`}
                              className="text-green-600 hover:text-green-700 font-medium"
                            >
                              View →
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
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
                    Page {page} of {totalPages} ({totalTransactions} total)
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

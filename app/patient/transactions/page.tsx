'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Transaction {
  id: string;
  patient_id: string;
  order_id: string | null;
  transaction_type: 'order' | 'refund' | 'adjustment' | 'payment';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  notes: string | null;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'order' | 'refund' | 'adjustment' | 'payment'>('all');
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadTransactions();
  }, [page, filter]);

  const loadTransactions = async () => {
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
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const response = await fetch(`/api/patient/transactions?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalTransactions(data.total || 0);
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

      const response = await fetch('/api/patient/transactions/export', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
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

  const getTypeBadge = (type: string) => {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (type) {
      case 'order':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'refund':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'adjustment':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'payment':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return baseClasses;
    }
  };

  const totalPages = Math.ceil(totalTransactions / 10);

  if (loading && transactions.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View your prescription and order transactions</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {(['all', 'order', 'refund', 'adjustment', 'payment'] as const).map(type => (
              <button
                key={type}
                onClick={() => {
                  setFilter(type);
                  setPage(1);
                }}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  filter === type
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
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

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
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
                        <span className={getTypeBadge(transaction.transaction_type)}>
                          {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
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
                            href={`/patient/orders/${transaction.order_id}`}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            View Order →
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

            {/* Notes Column Info */}
            {transactions.some(t => t.notes) && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <p className="font-medium mb-2">Transaction Notes:</p>
                {transactions
                  .filter(t => t.notes)
                  .map(t => (
                    <div key={t.id} className="mb-1">
                      <span className="font-medium">{t.description}:</span> {t.notes}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages} ({totalTransactions} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

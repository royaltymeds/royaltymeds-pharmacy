'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getRestockRequests } from '@/app/actions/restock';
import { RestockRequest } from '@/lib/types/restock';
import { ChevronRight, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase-client';
import { notifyBrowser } from '@/lib/client-notifications';
import { CustomSelect } from './CustomSelect';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export function RestockRequestsList() {
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await getRestockRequests(filter || undefined);
    if (data) {
      setRequests(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('restock-requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'restock_requests' },
        (payload: RealtimePostgresInsertPayload<{ request_number?: string }>) => {
          const requestNumber = payload.new.request_number || 'New restock order';
          toast.success(`New restock order submitted: ${requestNumber}`);
          notifyBrowser('New restock order submitted', { body: `Order ${requestNumber} was just submitted.` });
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      requested: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      linked_to_po: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      received: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    };
    return colors[status] || colors.requested;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'linked_to_po':
      case 'received':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Restock Orders</h2>
          <div className="flex gap-2">
            <CustomSelect
              value={filter}
              onChange={(value) => setFilter(value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'requested', label: 'Requested' },
                { value: 'linked_to_po', label: 'Linked to PO' },
                { value: 'received', label: 'Received' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">Loading restock orders...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No restock orders found</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter ? 'Try changing the filter' : 'Create your first restock order to get started'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {requests.map((request) => {
            const colors = getStatusColor(request.status);
            const itemCount = request.items?.length || 0;

            return (
              <Link
                key={request.id}
                href={`/admin/restock/${request.id}`}
                className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {request.request_number}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                          {getStatusIcon(request.status)}
                          {request.status.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase())}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Supplier</p>
                          <p className="text-gray-900 font-medium">{request.supplier?.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Items</p>
                          <p className="text-gray-900 font-medium">{itemCount} items</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="text-gray-900 font-medium">
                            ${Number(request.total_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Ordered {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

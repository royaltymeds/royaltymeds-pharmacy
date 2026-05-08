'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRestockRequestById, updateRestockRequestStatus } from '@/app/actions/restock';
import { RestockRequest } from '@/lib/types/restock';
import { ArrowLeft, Loader, Package, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RestockRequestDetailProps {
  requestId: string;
  userId: string;
}

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function RestockRequestDetail({ requestId, userId }: RestockRequestDetailProps) {
  const [request, setRequest] = useState<RestockRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const loadRequest = async () => {
    setLoading(true);
    const { data } = await getRestockRequestById(requestId);
    setRequest(data);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!request || !confirm('Cancel this restock request?')) return;
    setActionLoading(true);
    const { error } = await updateRestockRequestStatus(request.id, 'cancelled', userId, 'Cancelled from restock detail page');
    if (error) toast.error(error);
    else {
      toast.success('Restock request cancelled.');
      await loadRequest();
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!request) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Restock request not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/restock" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to Restock Management
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{request.request_number}</h2>
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-2 text-gray-600">
              Supplier request submitted directly into the purchase-order workflow; no approval step is required.
            </p>
          </div>

          {request.status === 'requested' && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-700 hover:bg-red-50 disabled:bg-gray-100"
            >
              <XCircle className="h-4 w-4" />
              Cancel Request
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <InfoCard label="Supplier" value={request.supplier?.name || 'Unknown'} />
          <InfoCard label="Total" value={formatCurrency(request.total_amount)} />
          <InfoCard label="Requested" value={new Date(request.created_at).toLocaleDateString()} />
          <InfoCard label="Expected Delivery" value={request.expected_delivery_date || 'Not set'} />
        </div>

        {request.purchase_order_id && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            This request is linked to an open or completed purchase order. Receiving is managed from the Purchase Orders tab.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Requested Items</h3>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200">
          {(request.items || []).map((item) => (
            <div key={item.id} className="grid gap-3 border-b border-gray-100 p-4 last:border-b-0 md:grid-cols-5">
              <div className="md:col-span-2">
                <p className="font-medium text-gray-900">{item.product_name}</p>
                <p className="text-xs uppercase text-gray-500">{item.product_type}</p>
              </div>
              <div><p className="text-xs text-gray-500">Requested</p><p className="font-medium text-gray-900">{item.quantity_requested}</p></div>
              <div><p className="text-xs text-gray-500">Received</p><p className="font-medium text-gray-900">{item.quantity_received}</p></div>
              <div><p className="text-xs text-gray-500">Line Total</p><p className="font-medium text-gray-900">{formatCurrency(item.total_price)}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}

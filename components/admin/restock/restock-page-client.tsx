'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Package, XCircle } from 'lucide-react';
import { RestockWorkflowTabs } from '@/components/admin/restock/restock-workflow-tabs';
import { NewRestockRequestForm } from '@/components/admin/restock/new-restock-request-form';

export function RestockPageClient({ userId, initialOpenNewRestockModal = false }: { userId: string; initialOpenNewRestockModal?: boolean }) {
  const [showNewRestockModal, setShowNewRestockModal] = useState(initialOpenNewRestockModal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restock Management</h1>
          <p className="text-gray-600 mt-2">Manage supplier request queues, scheduled re-orders, purchase orders, and receiving in one connected workflow.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/restock/suppliers" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            <Package className="w-4 h-4" />
            Manage Suppliers
          </Link>
          <button type="button" onClick={() => setShowNewRestockModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" />
            New Restock Order
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="font-semibold text-blue-900">Purchase-order driven workflow</h3>
        <p className="mt-1 text-sm text-blue-700">Restock requests queued under each supplier, are added to open supplier purchase orders automatically, and are received from the purchase order.</p>
      </div>

      <div id="purchase-order-workflow">
        <RestockWorkflowTabs userId={userId} />
      </div>

      {showNewRestockModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">New Restock Order</h2>
                <p className="text-gray-600 mt-1">Create and submit a restock order to a supplier</p>
              </div>
              <button type="button" onClick={() => setShowNewRestockModal(false)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <NewRestockRequestForm
              pharmacistId={userId}
              redirectOnSuccess={false}
              onCancel={() => setShowNewRestockModal(false)}
              onSubmitted={(requestId) => {
                setShowNewRestockModal(false);
                if (requestId) {
                  window.location.href = `/admin/restock/${requestId}`;
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

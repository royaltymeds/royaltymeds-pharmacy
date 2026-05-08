'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getRestockRequests,
  getUpcomingReorders,
  updatePurchaseOrderStatus,
} from '@/app/actions/restock';
import { PurchaseOrder, RestockRequest, UpcomingReorder } from '@/lib/types/restock';
import { CalendarDays, ChevronRight, ClipboardList, Loader, Package, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface RestockWorkflowTabsProps {
  userId: string;
}

type TabKey = 'requests' | 'schedule' | 'purchase_orders';

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function RestockWorkflowTabs({ userId }: RestockWorkflowTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('requests');
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [upcomingReorders, setUpcomingReorders] = useState<UpcomingReorder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({ supplier_id: '', reorder_date: '', is_custom_reorder_date: false, notes: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [requestResult, scheduleResult, poResult] = await Promise.all([
      getRestockRequests(),
      getUpcomingReorders(),
      getPurchaseOrders(),
    ]);

    if (requestResult.error || scheduleResult.error || poResult.error) {
      setError(requestResult.error || scheduleResult.error || poResult.error || 'Failed to load restock workflow');
    }

    setRequests(requestResult.data || []);
    setUpcomingReorders(scheduleResult.data || []);
    setPurchaseOrders(poResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const requestsBySupplier = useMemo(() => {
    return requests.reduce<Record<string, { supplierName: string; requests: RestockRequest[] }>>((groups, request) => {
      const key = request.supplier_id;
      if (!groups[key]) {
        groups[key] = { supplierName: request.supplier?.name || 'Unknown Supplier', requests: [] };
      }
      groups[key].requests.push(request);
      return groups;
    }, {});
  }, [requests]);

  const openPurchaseOrderModal = (supplierId?: string, reorderDate?: string | null) => {
    setPoForm({
      supplier_id: supplierId || '',
      reorder_date: reorderDate || new Date().toISOString().split('T')[0],
      is_custom_reorder_date: !reorderDate,
      notes: '',
    });
    setShowPoModal(true);
  };

  const handleCreatePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionLoading(true);
    setError(null);

    const { error: createError } = await createPurchaseOrder(userId, poForm);
    if (createError) {
      setError(createError);
      toast.error(createError);
    } else {
      toast.success('Purchase order created and linked to current supplier requests.');
      setShowPoModal(false);
      await loadData();
      setActiveTab('purchase_orders');
    }

    setActionLoading(false);
  };

  const handleCancelPurchaseOrder = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(`Cancel ${purchaseOrder.po_number}? Linked requests will return to requested status.`)) return;
    setActionLoading(true);
    const { error: cancelError } = await updatePurchaseOrderStatus(purchaseOrder.id, 'cancelled');
    if (cancelError) {
      setError(cancelError);
      toast.error(cancelError);
    } else {
      toast.success('Purchase order cancelled.');
      await loadData();
    }
    setActionLoading(false);
  };

  const handleReceivePurchaseOrder = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(`Mark ${purchaseOrder.po_number} as received? This receives all purchase order quantities.`)) return;
    setActionLoading(true);
    const itemUpdates = (purchaseOrder.items || []).map((item) => ({
      itemId: item.id,
      quantity_received: item.quantity_ordered,
    }));
    const { error: receiveError } = await updatePurchaseOrderStatus(purchaseOrder.id, 'received', itemUpdates);
    if (receiveError) {
      setError(receiveError);
      toast.error(receiveError);
    } else {
      toast.success('Purchase order received and linked restock requests completed.');
      await loadData();
    }
    setActionLoading(false);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'requests', label: 'Current Requests', count: requests.length },
    { key: 'schedule', label: 'Upcoming Scheduled Re-orders', count: upcomingReorders.filter((item) => item.next_reorder_date).length },
    { key: 'purchase_orders', label: 'Purchase Orders', count: purchaseOrders.length },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} {typeof tab.count === 'number' && <span className="opacity-80">({tab.count})</span>}
              </button>
            ))}
          </div>
          <button
            onClick={() => openPurchaseOrderModal()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ClipboardList className="h-4 w-4" />
            Purchase Order
          </button>
        </div>

        {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Loader className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-300" />
            Loading restock workflow...
          </div>
        ) : (
          <div className="p-4">
            {activeTab === 'requests' && (
              <div className="space-y-4">
                {Object.keys(requestsBySupplier).length === 0 ? (
                  <EmptyState icon={Package} title="No current restock requests" subtitle="Submitted restock requests will appear grouped by supplier." />
                ) : (
                  Object.entries(requestsBySupplier).map(([supplierId, group]) => (
                    <section key={supplierId} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.supplierName}</h3>
                          <p className="text-sm text-gray-600">{group.requests.length} request(s) in this supplier queue</p>
                        </div>
                        <button
                          onClick={() => openPurchaseOrderModal(supplierId, upcomingReorders.find((item) => item.supplier.id === supplierId)?.next_reorder_date)}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Generate PO
                        </button>
                      </div>
                      <div className="divide-y divide-gray-200 rounded-lg bg-white">
                        {group.requests.map((request) => (
                          <Link key={request.id} href={`/admin/restock/${request.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-gray-900">{request.request_number}</span>
                                <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                  {request.status.replace(/_/g, ' ')}
                                </span>
                                {request.purchase_order_id && (
                                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                    linked to PO
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {(request.items || []).length} item(s) · {formatCurrency(request.total_amount)} · Requested {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcomingReorders.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3"><EmptyState icon={CalendarDays} title="No suppliers available" subtitle="Add suppliers and configure schedules from Manage Suppliers." /></div>
                ) : (
                  upcomingReorders.map((item) => (
                    <div key={item.supplier.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.supplier.name}</h3>
                          <p className="text-sm text-gray-600">{item.schedule_label}</p>
                        </div>
                        <CalendarDays className="h-5 w-5 text-green-600" />
                      </div>
                      <dl className="space-y-2 text-sm">
                        <div><dt className="text-gray-500">Next re-order</dt><dd className="font-medium text-gray-900">{formatDate(item.next_reorder_date)}</dd></div>
                        <div><dt className="text-gray-500">Contact</dt><dd className="font-medium text-gray-900">{item.supplier.contact_person || item.supplier.email || item.supplier.phone || 'Not provided'}</dd></div>
                        <div><dt className="text-gray-500">Lead time</dt><dd className="font-medium text-gray-900">{item.supplier.lead_time_days} day(s)</dd></div>
                      </dl>
                      <button
                        onClick={() => openPurchaseOrderModal(item.supplier.id, item.next_reorder_date)}
                        className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        Generate Purchase Order
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'purchase_orders' && (
              <div className="space-y-3">
                {purchaseOrders.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="No purchase orders yet" subtitle="Generate purchase orders from the supplier request queues or schedules." />
                ) : (
                  purchaseOrders.map((po) => (
                    <div key={po.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{po.po_number}</h3>
                            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${
                              po.status === 'open' ? 'border-blue-200 bg-blue-50 text-blue-700' : po.status === 'received' ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-700'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {po.supplier?.name} · Re-order date {formatDate(po.reorder_date)} · {(po.items || []).length} line item(s) · {formatCurrency(po.total_amount)}
                          </p>
                        </div>
                        {po.status === 'open' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleReceivePurchaseOrder(po)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
                            >
                              <Truck className="h-4 w-4" /> Receive
                            </button>
                            <button
                              onClick={() => handleCancelPurchaseOrder(po)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100"
                            >
                              <XCircle className="h-4 w-4" /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      {(po.items || []).length > 0 && (
                        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                          {(po.items || []).map((item) => (
                            <div key={item.id} className="grid grid-cols-1 gap-2 border-b border-gray-100 p-3 text-sm last:border-b-0 md:grid-cols-4">
                              <span className="font-medium text-gray-900">{item.product_name}</span>
                              <span className="text-gray-600">Ordered: {item.quantity_ordered}</span>
                              <span className="text-gray-600">Received: {item.quantity_received}</span>
                              <span className="text-gray-900">{formatCurrency(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreatePurchaseOrder} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Generate Purchase Order</h2>
              <button type="button" onClick={() => setShowPoModal(false)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
                <select
                  value={poForm.supplier_id}
                  onChange={(event) => setPoForm({ ...poForm, supplier_id: event.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select supplier</option>
                  {upcomingReorders.map((item) => (
                    <option key={item.supplier.id} value={item.supplier.id}>{item.supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Re-order Date *</label>
                <input
                  type="date"
                  value={poForm.reorder_date}
                  onChange={(event) => setPoForm({ ...poForm, reorder_date: event.target.value, is_custom_reorder_date: true })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(event) => setPoForm({ ...poForm, notes: event.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={actionLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
                {actionLoading ? 'Generating...' : 'Generate PO'}
              </button>
              <button type="button" onClick={() => setShowPoModal(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 px-6 py-12 text-center">
      <Icon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <p className="font-medium text-gray-600">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

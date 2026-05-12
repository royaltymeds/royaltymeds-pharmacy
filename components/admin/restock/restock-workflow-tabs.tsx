'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  placePurchaseOrder,
  updatePurchaseOrder,
  getRestockRequests,
  getUpcomingReorders,
  updatePurchaseOrderStatus,
} from '@/app/actions/restock';
import { PurchaseOrder, RestockRequest, UpcomingReorder } from '@/lib/types/restock';
import { CalendarDays, ChevronRight, ClipboardList, Edit2, Loader, Package, Send, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface RestockWorkflowTabsProps {
  userId: string;
}

type TabKey = 'requests' | 'schedule' | 'purchase_orders';

type EditFormItem = {
  itemId?: string;
  restock_request_id?: string;
  restock_item_id?: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_ordered: number;
  unit_price: number;
  notes?: string;
};

type ReceiveFormItem = {
  itemId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  received: boolean;
};

function formatCurrency(value: number | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function getRestockStatusClasses(status: RestockRequest['status']) {
  switch (status) {
    case 'requested':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    case 'linked_to_po':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'received':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
}

function getPurchaseOrderStatusClasses(status: PurchaseOrder['status']) {
  switch (status) {
    case 'open':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'placed':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'received':
      return 'border-green-200 bg-green-50 text-green-700';
    case 'cancelled':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
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
  const [poFormLocked, setPoFormLocked] = useState(false);
  const [receivingPurchaseOrder, setReceivingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [placingPurchaseOrder, setPlacingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [editItems, setEditItems] = useState<EditFormItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveFormItem[]>([]);
  const [focusedPurchaseOrderId, setFocusedPurchaseOrderId] = useState<string | null>(null);

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

  const openPurchaseOrdersBySupplier = useMemo(() => {
    return purchaseOrders.reduce<Record<string, PurchaseOrder>>((groups, purchaseOrder) => {
      if (purchaseOrder.status !== 'open') return groups;
      const existing = groups[purchaseOrder.supplier_id];
      if (!existing || purchaseOrder.reorder_date < existing.reorder_date) {
        groups[purchaseOrder.supplier_id] = purchaseOrder;
      }
      return groups;
    }, {});
  }, [purchaseOrders]);

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

  const openPurchaseOrderModal = (supplierId?: string, reorderDate?: string | null, lockFields = false) => {
    setPoForm({
      supplier_id: supplierId || '',
      reorder_date: reorderDate || new Date().toISOString().split('T')[0],
      is_custom_reorder_date: !reorderDate,
      notes: '',
    });
    setPoFormLocked(lockFields);
    setShowPoModal(true);
  };

  const viewPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setFocusedPurchaseOrderId(purchaseOrder.id);
    setActiveTab('purchase_orders');
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

  const openPlaceModal = (purchaseOrder: PurchaseOrder) => {
    setPlacingPurchaseOrder(purchaseOrder);
    setExpectedDeliveryDate(purchaseOrder.expected_delivery_date || '');
  };

  const openEditModal = (purchaseOrder: PurchaseOrder) => {
    setEditingPurchaseOrder(purchaseOrder);
    setEditNotes(purchaseOrder.notes || '');
    setEditItems((purchaseOrder.items || []).map((item) => ({
      itemId: item.id,
      restock_request_id: item.restock_request_id,
      restock_item_id: item.restock_item_id,
      product_id: item.product_id,
      product_type: item.product_type,
      product_name: item.product_name,
      quantity_ordered: item.quantity_ordered,
      unit_price: item.unit_price,
      notes: item.notes,
    })));
  };

  const handlePlacePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!placingPurchaseOrder) return;
    setActionLoading(true);
    const { error: placeError } = await placePurchaseOrder(placingPurchaseOrder.id, expectedDeliveryDate);
    if (placeError) {
      setError(placeError);
      toast.error(placeError);
    } else {
      toast.success('Purchase order placed with expected delivery date.');
      setPlacingPurchaseOrder(null);
      setExpectedDeliveryDate('');
      await loadData();
    }
    setActionLoading(false);
  };

  const handleEditPurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPurchaseOrder) return;
    setActionLoading(true);
    const { error: editError } = await updatePurchaseOrder(editingPurchaseOrder.id, { items: editItems, notes: editNotes });
    if (editError) {
      setError(editError);
      toast.error(editError);
    } else {
      toast.success('Purchase order and linked restock request items updated.');
      setEditingPurchaseOrder(null);
      setEditItems([]);
      await loadData();
    }
    setActionLoading(false);
  };

  const openReceiveModal = (purchaseOrder: PurchaseOrder) => {
    setReceivingPurchaseOrder(purchaseOrder);
    setReceiveItems((purchaseOrder.items || []).map((item) => ({
      itemId: item.id,
      productName: item.product_name,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_ordered,
      received: true,
    })));
  };

  const handleReceivePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!receivingPurchaseOrder) return;

    setActionLoading(true);
    const itemUpdates = receiveItems.map((item) => ({
      itemId: item.itemId,
      quantity_received: item.received ? Math.min(item.quantityOrdered, Math.max(0, Number.isFinite(item.quantityReceived) ? item.quantityReceived : 0)) : 0,
    }));
    const { error: receiveError } = await updatePurchaseOrderStatus(receivingPurchaseOrder.id, 'received', itemUpdates);
    if (receiveError) {
      setError(receiveError);
      toast.error(receiveError);
    } else {
      toast.success('Purchase order receiving saved and linked restock requests updated.');
      setReceivingPurchaseOrder(null);
      setReceiveItems([]);
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
                  Object.entries(requestsBySupplier).map(([supplierId, group]) => {
                    const openPurchaseOrder = openPurchaseOrdersBySupplier[supplierId];

                    return (
                      <section key={supplierId} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{group.supplierName}</h3>
                              {openPurchaseOrder && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                  linked to {openPurchaseOrder.po_number}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{group.requests.length} request(s) in this supplier queue</p>
                          </div>
                          {openPurchaseOrder ? (
                            <button
                              onClick={() => viewPurchaseOrder(openPurchaseOrder)}
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              View PO
                            </button>
                          ) : (
                            <button
                              onClick={() => openPurchaseOrderModal(supplierId, upcomingReorders.find((item) => item.supplier.id === supplierId)?.next_reorder_date, true)}
                              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Generate PO
                            </button>
                          )}
                        </div>
                        <div className="divide-y divide-gray-200 rounded-lg bg-white">
                          {group.requests.map((request) => (
                            <Link key={request.id} href={`/admin/restock/${request.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-gray-900">{request.request_number}</span>
                                  <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getRestockStatusClasses(request.status)}`}>
                                    {request.status.replace(/_/g, ' ')}
                                  </span>
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
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {upcomingReorders.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3"><EmptyState icon={CalendarDays} title="No suppliers available" subtitle="Add suppliers and configure schedules from Manage Suppliers." /></div>
                ) : (
                  upcomingReorders.map((item) => {
                    const openPurchaseOrder = openPurchaseOrdersBySupplier[item.supplier.id];

                    return (
                      <div key={item.supplier.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{item.supplier.name}</h3>
                              {openPurchaseOrder && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                  {openPurchaseOrder.po_number}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{item.schedule_label}</p>
                          </div>
                          <CalendarDays className="h-5 w-5 text-green-600" />
                        </div>
                        <dl className="space-y-2 text-sm">
                          <div><dt className="text-gray-500">Next re-order</dt><dd className="font-medium text-gray-900">{formatDate(item.next_reorder_date)}</dd></div>
                          <div><dt className="text-gray-500">Contact</dt><dd className="font-medium text-gray-900">{item.supplier.contact_person || item.supplier.email || item.supplier.phone || 'Not provided'}</dd></div>
                          <div><dt className="text-gray-500">Lead time</dt><dd className="font-medium text-gray-900">{item.supplier.lead_time_days} day(s)</dd></div>
                        </dl>
                        {openPurchaseOrder ? (
                          <button
                            onClick={() => viewPurchaseOrder(openPurchaseOrder)}
                            className="mt-4 w-full rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            View Purchase Order
                          </button>
                        ) : (
                          <button
                            onClick={() => openPurchaseOrderModal(item.supplier.id, item.next_reorder_date, true)}
                            className="mt-4 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Generate Purchase Order
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'purchase_orders' && (
              <div className="space-y-3">
                {purchaseOrders.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="No purchase orders yet" subtitle="Generate purchase orders from the supplier request queues or schedules." />
                ) : (
                  purchaseOrders.map((po) => (
                    <div key={po.id} className={`rounded-lg border p-4 ${focusedPurchaseOrderId === po.id ? 'border-blue-300 bg-blue-50/40' : 'border-gray-200'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{po.po_number}</h3>
                            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getPurchaseOrderStatusClasses(po.status)}`}>
                              {po.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">
                            {po.supplier?.name} · Re-order date {formatDate(po.reorder_date)} · Expected delivery {formatDate(po.expected_delivery_date)} · {(po.items || []).length} line item(s) · {formatCurrency(po.total_amount)}
                          </p>
                        </div>
                        {(po.status === 'open' || po.status === 'placed') && (
                          <div className="flex flex-wrap gap-2">
                            {po.status === 'open' && (
                              <>
                                <button
                                  onClick={() => openEditModal(po)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:bg-gray-100"
                                >
                                  <Edit2 className="h-4 w-4" /> Edit
                                </button>
                                <button
                                  onClick={() => openPlaceModal(po)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300"
                                >
                                  <Send className="h-4 w-4" /> Place Order
                                </button>
                              </>
                            )}
                            {po.status === 'placed' && (
                              <button
                                onClick={() => openReceiveModal(po)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
                              >
                                <Truck className="h-4 w-4" /> Receive
                              </button>
                            )}
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
                            <div key={item.id} className="grid grid-cols-1 gap-2 border-b border-gray-100 p-3 text-sm last:border-b-0 md:grid-cols-5">
                              <span className="font-medium text-gray-900">{item.product_name}</span>
                              <span className="text-gray-600">Ordered: {item.quantity_ordered}</span>
                              <span className="text-gray-600">Unit Cost: {formatCurrency(item.unit_price)}</span>
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
                  disabled={poFormLocked}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                  disabled={poFormLocked}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              {poFormLocked && (
                <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  Supplier and re-order date are locked because this purchase order is being generated from a scheduled re-order card.
                </p>
              )}
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


      {placingPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <form onSubmit={handlePlacePurchaseOrder} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Place {placingPurchaseOrder.po_number}</h2>
              <button type="button" onClick={() => setPlacingPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-600">Set the expected delivery date before marking this purchase order as placed.</p>
            <label className="mb-1 block text-sm font-medium text-gray-700">Expected Delivery Date *</label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(event) => setExpectedDeliveryDate(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={actionLoading} className="flex-1 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300">
                {actionLoading ? 'Placing...' : 'Place Order'}
              </button>
              <button type="button" onClick={() => setPlacingPurchaseOrder(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {editingPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <form onSubmit={handleEditPurchaseOrder} className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit {editingPurchaseOrder.po_number}</h2>
                <p className="text-sm text-gray-600">Changes to linked purchase order lines also update the matching restock request items.</p>
              </div>
              <button type="button" onClick={() => setEditingPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {editItems.map((item, index) => (
                <div key={item.itemId || index} className="rounded-lg border border-gray-200 p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Item Name</label>
                      <input
                        type="text"
                        value={item.product_name}
                        onChange={(event) => setEditItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, product_name: event.target.value } : currentItem))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Quantity</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={Number.isNaN(item.quantity_ordered) ? '' : item.quantity_ordered}
                        onChange={(event) => setEditItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, quantity_ordered: event.target.value === '' ? Number.NaN : Math.max(1, parseInt(event.target.value, 10)) } : currentItem))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Unit Cost</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.]?[0-9]*"
                        value={Number.isNaN(item.unit_price) ? '' : item.unit_price}
                        onChange={(event) => setEditItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, unit_price: event.target.value === '' ? Number.NaN : parseFloat(event.target.value) } : currentItem))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    Remove line
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={actionLoading || editItems.length === 0} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditingPurchaseOrder(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {receivingPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <form onSubmit={handleReceivePurchaseOrder} className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Receive {receivingPurchaseOrder.po_number}</h2>
                <p className="text-sm text-gray-600">Mark each line item as received or not received before completing the purchase order.</p>
              </div>
              <button type="button" onClick={() => setReceivingPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {receiveItems.map((item, index) => (
                <div key={item.itemId} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">Ordered: {item.quantityOrdered}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={item.received}
                        onChange={(event) => setReceiveItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? {
                          ...currentItem,
                          received: event.target.checked,
                          quantityReceived: event.target.checked ? currentItem.quantityReceived || currentItem.quantityOrdered : 0,
                        } : currentItem))}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                      />
                      Received
                    </label>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">Quantity received</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={Number.isNaN(item.quantityReceived) ? '' : item.quantityReceived}
                      disabled={!item.received}
                      onChange={(event) => setReceiveItems((current) => current.map((currentItem, itemIndex) => {
                        if (itemIndex !== index) return currentItem;

                        const quantityReceived = event.target.value === ''
                          ? Number.NaN
                          : Math.min(currentItem.quantityOrdered, Math.max(0, Number(event.target.value)));

                        return {
                          ...currentItem,
                          quantityReceived,
                          received: Number.isFinite(quantityReceived) && quantityReceived > 0,
                        };
                      }))}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={actionLoading} className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300">
                {actionLoading ? 'Saving...' : 'Complete Receiving'}
              </button>
              <button type="button" onClick={() => setReceivingPurchaseOrder(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  placePurchaseOrder,
  updatePurchaseOrder,
  getRestockRequests,
  getSupplierProducts,
  updateRestockRequestStatus,
  getUpcomingReorders,
  updatePurchaseOrderStatus,
} from '@/app/actions/restock';
import { PurchaseOrder, RestockRequest, SupplierProduct, UpcomingReorder } from '@/lib/types/restock';
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, Edit2, Loader, Package, Send, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';

interface RestockWorkflowTabsProps {
  userId: string;
}

type TabKey = 'requests' | 'request_history' | 'schedule' | 'purchase_orders';
type PurchaseOrderStatusFilter = PurchaseOrder['status'];

const PAGE_SIZE = 5;

type ManualPoItem = {
  supplier_product_id: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_ordered: number;
  unit_price: number;
};

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
  const [poForm, setPoForm] = useState({ supplier_id: '', reorder_date: '', is_custom_reorder_date: false, source: 'manual' as 'manual' | 'scheduled', notes: '' });
  const [poFormLocked, setPoFormLocked] = useState(false);
  const [receivingPurchaseOrder, setReceivingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [placingPurchaseOrder, setPlacingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [editItems, setEditItems] = useState<EditFormItem[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveFormItem[]>([]);
  const [focusedPurchaseOrderId, setFocusedPurchaseOrderId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest | null>(null);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [expandedScheduleSupplierId, setExpandedScheduleSupplierId] = useState<string | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [manualPoItems, setManualPoItems] = useState<ManualPoItem[]>([]);
  const [selectedRequestSupplier, setSelectedRequestSupplier] = useState<{ supplierId: string; supplierName: string; requests: RestockRequest[]; mode: 'current' | 'history' } | null>(null);
  const [requestSupplierPage, setRequestSupplierPage] = useState(1);
  const [activePurchaseOrderStatus, setActivePurchaseOrderStatus] = useState<PurchaseOrderStatusFilter>('open');
  const [selectedPurchaseOrderSupplier, setSelectedPurchaseOrderSupplier] = useState<{ supplierId: string; supplierName: string; status: PurchaseOrderStatusFilter; purchaseOrders: PurchaseOrder[] } | null>(null);
  const [purchaseOrderSupplierPage, setPurchaseOrderSupplierPage] = useState(1);

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

  const currentRequests = useMemo(() => requests.filter((request) => request.status === 'requested' || request.status === 'linked_to_po'), [requests]);
  const requestHistory = useMemo(() => requests.filter((request) => request.status === 'received' || request.status === 'cancelled'), [requests]);

  const requestsBySupplier = useMemo(() => {
    return currentRequests.reduce<Record<string, { supplierName: string; requests: RestockRequest[] }>>((groups, request) => {
      const key = request.supplier_id;
      if (!groups[key]) {
        groups[key] = { supplierName: request.supplier?.name || 'Unknown Supplier', requests: [] };
      }
      groups[key].requests.push(request);
      return groups;
    }, {});
  }, [currentRequests]);

  const requestHistoryBySupplier = useMemo(() => {
    return requestHistory.reduce<Record<string, { supplierName: string; requests: RestockRequest[] }>>((groups, request) => {
      const key = request.supplier_id;
      if (!groups[key]) {
        groups[key] = { supplierName: request.supplier?.name || 'Unknown Supplier', requests: [] };
      }
      groups[key].requests.push(request);
      return groups;
    }, {});
  }, [requestHistory]);

  const purchaseOrderStatusTabs: { status: PurchaseOrderStatusFilter; label: string }[] = [
    { status: 'open', label: 'Open' },
    { status: 'placed', label: 'Placed' },
    { status: 'received', label: 'Received' },
    { status: 'cancelled', label: 'Cancelled' },
  ];

  const purchaseOrdersByStatusAndSupplier = useMemo(() => {
    return purchaseOrders.reduce<Record<PurchaseOrderStatusFilter, Record<string, { supplierName: string; purchaseOrders: PurchaseOrder[] }>>>((groups, purchaseOrder) => {
      const status = purchaseOrder.status;
      const supplierId = purchaseOrder.supplier_id;
      if (!groups[status][supplierId]) {
        groups[status][supplierId] = { supplierName: purchaseOrder.supplier?.name || 'Unknown Supplier', purchaseOrders: [] };
      }
      groups[status][supplierId].purchaseOrders.push(purchaseOrder);
      return groups;
    }, { open: {}, placed: {}, received: {}, cancelled: {} });
  }, [purchaseOrders]);

  const openRequestSupplierModal = (supplierId: string, group: { supplierName: string; requests: RestockRequest[] }, mode: 'current' | 'history') => {
    setRequestSupplierPage(1);
    setSelectedRequestSupplier({ supplierId, supplierName: group.supplierName, requests: group.requests, mode });
  };

  const openPurchaseOrderSupplierModal = (supplierId: string, group: { supplierName: string; purchaseOrders: PurchaseOrder[] }, status: PurchaseOrderStatusFilter) => {
    setPurchaseOrderSupplierPage(1);
    setSelectedPurchaseOrderSupplier({ supplierId, supplierName: group.supplierName, status, purchaseOrders: group.purchaseOrders });
  };

  const loadSupplierProductsForPo = useCallback(async (supplierId: string) => {
    if (!supplierId) {
      setSupplierProducts([]);
      return;
    }
    const { data, error: supplierProductError } = await getSupplierProducts(supplierId);
    if (supplierProductError) {
      setError(supplierProductError);
      setSupplierProducts([]);
      return;
    }
    setSupplierProducts(data || []);
  }, []);

  const openPurchaseOrderModal = (supplierId?: string, reorderDate?: string | null, lockFields = false) => {
    setPoForm({
      supplier_id: supplierId || '',
      reorder_date: reorderDate || new Date().toISOString().split('T')[0],
      is_custom_reorder_date: !reorderDate,
      source: lockFields ? 'scheduled' : 'manual',
      notes: '',
    });
    setPoFormLocked(lockFields);
    setManualPoItems([]);
    setSupplierProducts([]);
    if (supplierId) void loadSupplierProductsForPo(supplierId);
    setShowPoModal(true);
  };

  const viewPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setFocusedPurchaseOrderId(purchaseOrder.id);
    setSelectedPurchaseOrder(purchaseOrder);
    setActiveTab('purchase_orders');
  };

  const handleCreatePurchaseOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionLoading(true);
    setError(null);

    const { error: createError } = await createPurchaseOrder(userId, {
      ...poForm,
      items: poForm.source === 'manual' ? manualPoItems.map(({ supplier_product_id, ...item }) => item) : undefined,
    });
    if (createError) {
      setError(createError);
      toast.error(createError);
    } else {
      toast.success(poForm.source === 'manual' ? 'Manual purchase order created with selected supplier products.' : 'Purchase order created and linked to current supplier requests.');
      setShowPoModal(false);
      setManualPoItems([]);
      setSupplierProducts([]);
      await loadData();
      setActiveTab('purchase_orders');
    }

    setActionLoading(false);
  };

  const handleCancelRequest = async (request: RestockRequest) => {
    if (!confirm(`Cancel ${request.request_number}?`)) return;
    setActionLoading(true);
    if (request.purchase_order_id) {
      const { error: cancelError } = await updatePurchaseOrderStatus(request.purchase_order_id, 'cancelled');
      if (cancelError) { setError(cancelError); toast.error(cancelError); } else { toast.success('Linked purchase order cancelled and request returned to queue.'); }
    } else {
      const result = await updateRestockRequestStatus(request.id, 'cancelled', userId);
      if (result.error) { setError(result.error); toast.error(result.error); } else { toast.success('Restock request cancelled.'); }
    }
    setSelectedRequest(null);
    await loadData();
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
    void loadSupplierProductsForPo(purchaseOrder.supplier_id);
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

  const addManualPoItem = (product: SupplierProduct) => {
    if (manualPoItems.some((item) => item.supplier_product_id === product.id)) return;
    setManualPoItems((current) => [
      ...current,
      {
        supplier_product_id: product.id,
        product_id: product.product_id,
        product_type: product.product_type,
        product_name: product.product_name || product.product_id,
        quantity_ordered: product.minimum_order_quantity || 1,
        unit_price: product.supplier_unit_price || 0,
      },
    ]);
  };

  const addProductToEditPurchaseOrder = (product: SupplierProduct) => {
    if (editItems.some((item) => item.product_id === product.product_id && item.product_type === product.product_type)) return;
    setEditItems((current) => [
      ...current,
      {
        product_id: product.product_id,
        product_type: product.product_type,
        product_name: product.product_name || product.product_id,
        quantity_ordered: product.minimum_order_quantity || 1,
        unit_price: product.supplier_unit_price || 0,
      },
    ]);
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
    { key: 'requests', label: 'Current Requests', count: currentRequests.length },
    { key: 'request_history', label: 'Request History', count: requestHistory.length },
    { key: 'schedule', label: 'Upcoming Scheduled Re-orders', count: upcomingReorders.filter((item) => item.next_reorder_date).length },
    { key: 'purchase_orders', label: 'Purchase Orders', count: purchaseOrders.length },
  ];

  const selectedRequestSupplierTotalPages = selectedRequestSupplier ? Math.max(1, Math.ceil(selectedRequestSupplier.requests.length / PAGE_SIZE)) : 1;
  const selectedRequestSupplierRequests = selectedRequestSupplier ? selectedRequestSupplier.requests.slice((requestSupplierPage - 1) * PAGE_SIZE, requestSupplierPage * PAGE_SIZE) : [];
  const selectedPurchaseOrderSupplierTotalPages = selectedPurchaseOrderSupplier ? Math.max(1, Math.ceil(selectedPurchaseOrderSupplier.purchaseOrders.length / PAGE_SIZE)) : 1;
  const selectedPurchaseOrderSupplierPurchaseOrders = selectedPurchaseOrderSupplier ? selectedPurchaseOrderSupplier.purchaseOrders.slice((purchaseOrderSupplierPage - 1) * PAGE_SIZE, purchaseOrderSupplierPage * PAGE_SIZE) : [];

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
                      <button key={supplierId} type="button" onClick={() => openRequestSupplierModal(supplierId, group, 'current')} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{group.supplierName}</h3>
                              {openPurchaseOrder && (
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">linked to {openPurchaseOrder.po_number}</span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{group.requests.length} current request(s) · {formatCurrency(group.requests.reduce((sum, request) => sum + Number(request.total_amount || 0), 0))}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'request_history' && (
              <div className="space-y-4">
                {Object.keys(requestHistoryBySupplier).length === 0 ? (
                  <EmptyState icon={ClipboardList} title="No request history yet" subtitle="Received and cancelled supplier requests will appear here after they leave active PO queues." />
                ) : (
                  Object.entries(requestHistoryBySupplier).map(([supplierId, group]) => (
                    <button key={supplierId} type="button" onClick={() => openRequestSupplierModal(supplierId, group, 'history')} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{group.supplierName}</h3>
                          <p className="text-sm text-gray-600">{group.requests.length} completed/cancelled historical request(s) · {formatCurrency(group.requests.reduce((sum, request) => sum + Number(request.total_amount || 0), 0))}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-3">
                {upcomingReorders.length === 0 ? (
                  <EmptyState icon={CalendarDays} title="No suppliers available" subtitle="Add suppliers and configure schedules from Manage Suppliers." />
                ) : (
                  upcomingReorders.map((item) => {
                    const openPurchaseOrder = openPurchaseOrdersBySupplier[item.supplier.id];
                    const isExpanded = expandedScheduleSupplierId === item.supplier.id;

                    return (
                      <section key={item.supplier.id} className="rounded-lg border border-gray-200 bg-white p-4">
                        <button type="button" onClick={() => setExpandedScheduleSupplierId(isExpanded ? null : item.supplier.id)} className="flex w-full items-center justify-between gap-3 text-left">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{item.supplier.name}</h3>
                              {openPurchaseOrder && <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{openPurchaseOrder.po_number}</span>}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{item.schedule_label} · Upcoming {formatDate(item.next_reorder_date)}</p>
                          </div>
                          {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <dl className="grid gap-3 text-sm md:grid-cols-3">
                              <div><dt className="text-gray-500">Contact</dt><dd className="font-medium text-gray-900">{item.supplier.contact_person || item.supplier.email || item.supplier.phone || 'Not provided'}</dd></div>
                              <div><dt className="text-gray-500">Lead time</dt><dd className="font-medium text-gray-900">{item.supplier.lead_time_days} day(s)</dd></div>
                              <div><dt className="text-gray-500">Minimum order</dt><dd className="font-medium text-gray-900">{formatCurrency(item.supplier.minimum_order_amount)}</dd></div>
                            </dl>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {openPurchaseOrder ? (
                                <button type="button" onClick={() => viewPurchaseOrder(openPurchaseOrder)} className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">View PO</button>
                              ) : (
                                <button type="button" onClick={() => openPurchaseOrderModal(item.supplier.id, item.next_reorder_date, true)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Generate PO</button>
                              )}
                            </div>
                          </div>
                        )}
                      </section>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'purchase_orders' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {purchaseOrderStatusTabs.map((statusTab) => {
                    const statusCount = purchaseOrders.filter((po) => po.status === statusTab.status).length;
                    return (
                      <button key={statusTab.status} type="button" onClick={() => setActivePurchaseOrderStatus(statusTab.status)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activePurchaseOrderStatus === statusTab.status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {statusTab.label} ({statusCount})
                      </button>
                    );
                  })}
                </div>
                {purchaseOrders.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="No purchase orders yet" subtitle="Generate purchase orders from the supplier request queues or schedules." />
                ) : Object.keys(purchaseOrdersByStatusAndSupplier[activePurchaseOrderStatus]).length === 0 ? (
                  <EmptyState icon={ClipboardList} title={`No ${activePurchaseOrderStatus} purchase orders`} subtitle="Suppliers with purchase orders in this status will appear here." />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(purchaseOrdersByStatusAndSupplier[activePurchaseOrderStatus]).map(([supplierId, group]) => (
                      <button key={supplierId} type="button" onClick={() => openPurchaseOrderSupplierModal(supplierId, group, activePurchaseOrderStatus)} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{group.supplierName}</h3>
                            <p className="text-sm text-gray-600">{group.purchaseOrders.length} {activePurchaseOrderStatus} PO(s) · {formatCurrency(group.purchaseOrders.reduce((sum, po) => sum + Number(po.total_amount || 0), 0))}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreatePurchaseOrder} className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Generate Purchase Order</h2>
              <button type="button" onClick={() => setShowPoModal(false)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
                <select
                  value={poForm.supplier_id}
                  onChange={(event) => { setPoForm({ ...poForm, supplier_id: event.target.value }); setManualPoItems([]); void loadSupplierProductsForPo(event.target.value); }}
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
              {!poFormLocked && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">PO Source</label>
                  <select
                    value={poForm.source}
                    onChange={(event) => setPoForm({ ...poForm, source: event.target.value as 'manual' | 'scheduled', is_custom_reorder_date: event.target.value === 'manual' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="manual">Manual - do not auto-link requests</option>
                    <option value="scheduled">Scheduled/request queue - auto-link current requests</option>
                  </select>
                </div>
              )}
              {poFormLocked && (
                <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  Supplier and re-order date are locked because this purchase order is being generated from a scheduled re-order card.
                </p>
              )}
              {poForm.source === 'manual' && poForm.supplier_id && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">Manual PO supplier products</h3>
                  <p className="text-sm text-blue-800">Add linked supplier products directly to this manual purchase order. These lines do not move restock requests.</p>
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-white p-2">
                    {supplierProducts.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">No active products are linked to this supplier.</p>
                    ) : supplierProducts.map((product) => (
                      <button key={product.id} type="button" onClick={() => addManualPoItem(product)} disabled={manualPoItems.some((item) => item.supplier_product_id === product.id)} className="flex w-full items-center justify-between rounded border border-gray-200 p-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                        <span>{product.product_name || product.product_id}</span>
                        <span>{formatCurrency(product.supplier_unit_price)}</span>
                      </button>
                    ))}
                  </div>
                  {manualPoItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {manualPoItems.map((item, index) => (
                        <div key={item.supplier_product_id} className="grid gap-2 rounded bg-white p-2 text-sm md:grid-cols-5">
                          <span className="font-medium md:col-span-2">{item.product_name}</span>
                          <input type="text" inputMode="numeric" pattern="[0-9]*" value={Number.isNaN(item.quantity_ordered) ? '' : item.quantity_ordered} onChange={(event) => setManualPoItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, quantity_ordered: event.target.value === '' ? Number.NaN : Math.max(1, parseInt(event.target.value, 10)) } : currentItem))} className="rounded border border-gray-300 px-2 py-1" />
                          <input type="text" inputMode="decimal" pattern="[0-9]*[.]?[0-9]*" value={Number.isNaN(item.unit_price) ? '' : item.unit_price} onChange={(event) => setManualPoItems((current) => current.map((currentItem, itemIndex) => itemIndex === index ? { ...currentItem, unit_price: event.target.value === '' ? Number.NaN : parseFloat(event.target.value) } : currentItem))} className="rounded border border-gray-300 px-2 py-1" />
                          <button type="button" onClick={() => setManualPoItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-red-700 hover:text-red-800">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">Add linked supplier items</h3>
              <p className="text-sm text-blue-800">Manual purchase orders can be linked to additional supplier products after creation.</p>
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-white p-2">
                {supplierProducts.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">No active products are linked to this supplier.</p>
                ) : supplierProducts.map((product) => {
                  const alreadyAdded = editItems.some((item) => item.product_id === product.product_id && item.product_type === product.product_type);
                  return (
                    <button key={product.id} type="button" onClick={() => addProductToEditPurchaseOrder(product)} disabled={alreadyAdded} className="flex w-full items-center justify-between rounded border border-gray-200 p-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                      <span>{product.product_name || product.product_id}</span>
                      <span>{alreadyAdded ? 'Added' : formatCurrency(product.supplier_unit_price)}</span>
                    </button>
                  );
                })}
              </div>
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


      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                {selectedRequestSupplier && <button type="button" onClick={() => setSelectedRequest(null)} className="mb-1 text-sm font-medium text-blue-700 hover:text-blue-800">← Back to {selectedRequestSupplier.supplierName} requests</button>}
                <h2 className="text-xl font-semibold text-gray-900">{selectedRequest.request_number}</h2>
              </div>
              <button type="button" onClick={() => setSelectedRequest(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm md:grid-cols-2">
              <div><span className="text-gray-500">Supplier</span><p className="font-medium text-gray-900">{selectedRequest.supplier?.name || 'Unknown'}</p></div>
              <div><span className="text-gray-500">Submitted by</span><p className="font-medium text-gray-900">{selectedRequest.pharmacist?.full_name || selectedRequest.pharmacist?.email || 'Unknown user'}</p></div>
              <div><span className="text-gray-500">Status</span><p className="font-medium text-gray-900">{selectedRequest.status.replace(/_/g, ' ')}</p></div>
              <div><span className="text-gray-500">Total</span><p className="font-medium text-gray-900">{formatCurrency(selectedRequest.total_amount)}</p></div>
              <div><span className="text-gray-500">Requested</span><p className="font-medium text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p></div>
              {selectedRequest.actual_delivery_date && <div><span className="text-gray-500">Received</span><p className="font-medium text-gray-900">{formatDate(selectedRequest.actual_delivery_date)}</p></div>}
            </div>
            <div className="mt-4 divide-y rounded-lg border border-gray-200">
              {(selectedRequest.items || []).map((item) => (
                <div key={item.id} className="grid gap-2 p-3 text-sm md:grid-cols-4">
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  <span>Qty: {item.quantity_requested}</span>
                  <span>Unit: {formatCurrency(item.unit_price)}</span>
                  <span>Total: {formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
            {selectedRequest.status === 'requested' && (
              <button type="button" onClick={() => handleCancelRequest(selectedRequest)} disabled={actionLoading} className="mt-4 w-full rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100">
                Cancel Request
              </button>
            )}
          </div>
        </div>
      )}

      {selectedRequestSupplier && !selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedRequestSupplier.supplierName} {selectedRequestSupplier.mode === 'current' ? 'current requests' : 'request history'}</h2>
                <p className="text-sm text-gray-600">Page {requestSupplierPage} of {selectedRequestSupplierTotalPages}</p>
              </div>
              <button type="button" onClick={() => setSelectedRequestSupplier(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="divide-y rounded-lg border border-gray-200">
              {selectedRequestSupplierRequests.map((request) => (
                <button key={request.id} type="button" onClick={() => setSelectedRequest(request)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-gray-900">{request.request_number}</span><span className={`rounded-full border px-2 py-1 text-xs font-medium ${getRestockStatusClasses(request.status)}`}>{request.status.replace(/_/g, ' ')}</span></div>
                    <p className="mt-1 text-sm text-gray-600">{(request.items || []).length} item(s) · {formatCurrency(request.total_amount)} · Submitted by {request.pharmacist?.full_name || request.pharmacist?.email || 'Unknown user'} · Requested {new Date(request.created_at).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setRequestSupplierPage((page) => Math.max(1, page - 1))} disabled={requestSupplierPage === 1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-600">{selectedRequestSupplier.requests.length} total request(s)</span>
              <button type="button" onClick={() => setRequestSupplierPage((page) => Math.min(selectedRequestSupplierTotalPages, page + 1))} disabled={requestSupplierPage === selectedRequestSupplierTotalPages} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {selectedPurchaseOrderSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedPurchaseOrderSupplier.supplierName} {selectedPurchaseOrderSupplier.status} purchase orders</h2>
                <p className="text-sm text-gray-600">Page {purchaseOrderSupplierPage} of {selectedPurchaseOrderSupplierTotalPages}</p>
              </div>
              <button type="button" onClick={() => setSelectedPurchaseOrderSupplier(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="divide-y rounded-lg border border-gray-200">
              {selectedPurchaseOrderSupplierPurchaseOrders.map((po) => (
                <div key={po.id} onClick={() => setSelectedPurchaseOrder(po)} className={`cursor-pointer p-4 hover:bg-gray-50 ${focusedPurchaseOrderId === po.id ? 'bg-blue-50/40' : ''}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-gray-900">{po.po_number}</h3><span className={`rounded-full border px-2 py-1 text-xs font-medium ${getPurchaseOrderStatusClasses(po.status)}`}>{po.status}</span></div>
                      <p className="mt-1 text-sm text-gray-600">{po.source === 'manual' ? 'Manual PO' : 'Scheduled PO'} · Re-order date {formatDate(po.reorder_date)} · Expected delivery {formatDate(po.expected_delivery_date)} · {(po.items || []).length} line item(s) · {formatCurrency(po.total_amount)}</p>
                    </div>
                    {(po.status === 'open' || po.status === 'placed') && (
                      <div className="flex flex-wrap gap-2">
                        {po.status === 'open' && <><button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openEditModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:bg-gray-100"><Edit2 className="h-4 w-4" /> Edit</button><button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openPlaceModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300"><Send className="h-4 w-4" /> Place Order</button></>}
                        {po.status === 'placed' && <button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openReceiveModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"><Truck className="h-4 w-4" /> Receive</button>}
                        <button onClick={(event) => { event.stopPropagation(); handleCancelPurchaseOrder(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100"><XCircle className="h-4 w-4" /> Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setPurchaseOrderSupplierPage((page) => Math.max(1, page - 1))} disabled={purchaseOrderSupplierPage === 1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="text-sm text-gray-600">{selectedPurchaseOrderSupplier.purchaseOrders.length} total PO(s)</span>
              <button type="button" onClick={() => setPurchaseOrderSupplierPage((page) => Math.min(selectedPurchaseOrderSupplierTotalPages, page + 1))} disabled={purchaseOrderSupplierPage === selectedPurchaseOrderSupplierTotalPages} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {selectedPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{selectedPurchaseOrder.po_number}</h2>
              <button type="button" onClick={() => setSelectedPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600">{selectedPurchaseOrder.supplier?.name} · {selectedPurchaseOrder.source === 'manual' ? 'Manual PO' : 'Scheduled PO'} · Status: {selectedPurchaseOrder.status} · Total {formatCurrency(selectedPurchaseOrder.total_amount)}</p>
            <div className="mt-4 divide-y rounded-lg border border-gray-200">
              {(selectedPurchaseOrder.items || []).map((item) => (
                <div key={item.id} className="grid gap-2 p-3 text-sm md:grid-cols-5">
                  <span className="font-medium text-gray-900">{item.product_name}</span>
                  <span>Ordered: {item.quantity_ordered}</span>
                  <span>Unit: {formatCurrency(item.unit_price)}</span>
                  <span>Received: {item.quantity_received}</span>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}
            </div>
          </div>
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

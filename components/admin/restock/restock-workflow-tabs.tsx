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
  putRestockRequestOnHold,
  putRestockItemOnHold,
  getHeldRestockItems,
  releaseHeldRestockRequestToPurchaseOrder,
  releaseHeldRestockItemToPurchaseOrder,
  getUpcomingReorders,
  updatePurchaseOrderStatus,
} from '@/app/actions/restock';
import { PurchaseOrder, RestockItem, RestockRequest, SupplierProduct, UpcomingReorder } from '@/lib/types/restock';
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, Download, Edit2, Loader, Package, Printer, Send, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from './confirmation-modal';

interface RestockWorkflowTabsProps {
  userId: string;
}

type TabKey = 'requests' | 'request_history' | 'schedule' | 'purchase_orders';
type PurchaseOrderStatusFilter = PurchaseOrder['status'] | 'on_hold';

const PAGE_SIZE = 5;
const ITEM_SELECTOR_PAGE_SIZE = 15;

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

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    case 'on_hold':
      return 'border-orange-200 bg-orange-50 text-orange-700';
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
  const [heldItems, setHeldItems] = useState<RestockItem[]>([]);
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
  const [supplierProductSearch, setSupplierProductSearch] = useState('');
  const [supplierProductPage, setSupplierProductPage] = useState(1);
  const [manualPoItems, setManualPoItems] = useState<ManualPoItem[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<{ title: string; message: string; confirmLabel: string; onConfirm: () => void } | null>(null);
  const [selectedRequestSupplier, setSelectedRequestSupplier] = useState<{ supplierId: string; supplierName: string; requests: RestockRequest[]; mode: 'current' | 'history' } | null>(null);
  const [requestSupplierPage, setRequestSupplierPage] = useState(1);
  const [activePurchaseOrderStatus, setActivePurchaseOrderStatus] = useState<PurchaseOrderStatusFilter>('open');
  const [selectedPurchaseOrderSupplier, setSelectedPurchaseOrderSupplier] = useState<{ supplierId: string; supplierName: string; status: PurchaseOrderStatusFilter; purchaseOrders: PurchaseOrder[] } | null>(null);
  const [purchaseOrderSupplierPage, setPurchaseOrderSupplierPage] = useState(1);
  const [releaseTarget, setReleaseTarget] = useState<{ kind: 'request' | 'item'; id: string; supplierId: string; label: string } | null>(null);
  const [releasePurchaseOrderId, setReleasePurchaseOrderId] = useState('');
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  const [requestTabFilter, setRequestTabFilter] = useState<'all' | 'requested' | 'linked_to_po' | 'linked_po_placed'>('all');
  const [requestHistoryTabFilter, setRequestHistoryTabFilter] = useState<'all' | 'received' | 'cancelled'>('all');
  const [scheduleTabFilter, setScheduleTabFilter] = useState<'all' | 'with_open_po' | 'without_open_po'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [requestResult, scheduleResult, poResult, heldItemResult] = await Promise.all([
      getRestockRequests(),
      getUpcomingReorders(),
      getPurchaseOrders(),
      getHeldRestockItems(),
    ]);

    if (requestResult.error || scheduleResult.error || poResult.error || heldItemResult.error) {
      setError(requestResult.error || scheduleResult.error || poResult.error || heldItemResult.error || 'Failed to load restock workflow');
    }

    setRequests(requestResult.data || []);
    setUpcomingReorders(scheduleResult.data || []);
    setPurchaseOrders(poResult.data || []);
    setHeldItems(heldItemResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openPurchaseOrdersBySupplier = useMemo(() => {
    return purchaseOrders.reduce<Record<string, PurchaseOrder>>((groups, purchaseOrder) => {
      if (purchaseOrder.status !== 'open' || purchaseOrder.source === 'manual') return groups;
      const existing = groups[purchaseOrder.supplier_id];
      if (!existing || purchaseOrder.reorder_date < existing.reorder_date) {
        groups[purchaseOrder.supplier_id] = purchaseOrder;
      }
      return groups;
    }, {});
  }, [purchaseOrders]);


  const purchaseOrdersById = useMemo(() => purchaseOrders.reduce<Record<string, PurchaseOrder>>((acc, po) => {
    acc[po.id] = po;
    return acc;
  }, {}), [purchaseOrders]);

  const requestLinkedToPlacedPo = useCallback((request: RestockRequest) => {
    if (!request.purchase_order_id) return false;
    return purchaseOrdersById[request.purchase_order_id]?.status === 'placed';
  }, [purchaseOrdersById]);

  const currentRequests = useMemo(() => requests.filter((request) => request.status === 'requested' || request.status === 'linked_to_po'), [requests]);
  const heldRequests = useMemo(() => requests.filter((request) => request.status === 'on_hold'), [requests]);
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
    { status: 'on_hold', label: 'On Hold' },
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
    }, { open: {}, placed: {}, received: {}, cancelled: {}, on_hold: {} });
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
    setSupplierProductSearch('');
    setSupplierProductPage(1);
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

  const confirmCancelRequest = (request: RestockRequest) => {
    setPendingConfirmation({
      title: `Cancel ${request.request_number}?`,
      message: request.purchase_order_id ? 'The linked purchase order will be cancelled and the request will return to the queue according to the current workflow.' : 'This request will move to cancelled history.',
      confirmLabel: 'Cancel request',
      onConfirm: () => void handleCancelRequest(request),
    });
  };

  const handleCancelRequest = async (request: RestockRequest) => {
    setPendingConfirmation(null);
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


  const handlePutRequestOnHold = async (request: RestockRequest) => {
    setActionLoading(true);
    const { error: holdError } = await putRestockRequestOnHold(request.id, userId, 'Supplier does not currently have the requested items in stock.');
    if (holdError) {
      setError(holdError);
      toast.error(holdError);
    } else {
      toast.success('Restock request moved to the Purchase Orders on-hold queue.');
      setSelectedRequest(null);
      await loadData();
      setActiveTab('purchase_orders');
      setActivePurchaseOrderStatus('on_hold');
    }
    setActionLoading(false);
  };

  const handlePutItemOnHold = async (item: RestockItem) => {
    setActionLoading(true);
    const { error: holdError } = await putRestockItemOnHold(item.id, userId, 'Supplier does not currently have this line item in stock.');
    if (holdError) {
      setError(holdError);
      toast.error(holdError);
    } else {
      toast.success('Item orphaned from its request and moved to the Purchase Orders on-hold queue.');
      await loadData();
      setActiveTab('purchase_orders');
      setActivePurchaseOrderStatus('on_hold');
    }
    setActionLoading(false);
  };

  const handlePutPurchaseOrderItemOnHold = async (restockItemId: string, label: string) => {
    setActionLoading(true);
    const { error: holdError } = await putRestockItemOnHold(restockItemId, userId, 'Item put on hold from purchase order details modal.');
    if (holdError) {
      setError(holdError);
      toast.error(holdError);
    } else {
      toast.success(`${label} moved to the Purchase Orders on-hold queue.`);
      setSelectedPurchaseOrder(null);
      setActivePurchaseOrderStatus('on_hold');
      await loadData();
    }
    setActionLoading(false);
  };

  const openReleaseHeldRequest = (request: RestockRequest) => {
    const firstOpenPo = purchaseOrders.find((po) => po.status === 'open' && po.supplier_id === request.supplier_id);
    setReleaseTarget({ kind: 'request', id: request.id, supplierId: request.supplier_id, label: request.request_number });
    setReleasePurchaseOrderId(firstOpenPo?.id || '');
  };

  const openReleaseHeldItem = (item: RestockItem) => {
    const supplierId = requests.find((request) => request.id === item.held_from_request_id)?.supplier_id || '';
    const firstOpenPo = purchaseOrders.find((po) => po.status === 'open' && po.supplier_id === supplierId);
    setReleaseTarget({ kind: 'item', id: item.id, supplierId, label: item.product_name });
    setReleasePurchaseOrderId(firstOpenPo?.id || '');
  };

  const handleReleaseFromHold = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!releaseTarget || !releasePurchaseOrderId) return;
    setActionLoading(true);
    const result = releaseTarget.kind === 'request'
      ? await releaseHeldRestockRequestToPurchaseOrder(releaseTarget.id, releasePurchaseOrderId, userId)
      : await releaseHeldRestockItemToPurchaseOrder(releaseTarget.id, releasePurchaseOrderId, userId);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(releaseTarget.kind === 'request' ? 'Held request linked to the selected purchase order.' : 'Held item linked to a new system-generated request and the selected purchase order.');
      setReleaseTarget(null);
      setReleasePurchaseOrderId('');
      await loadData();
    }
    setActionLoading(false);
  };

  const confirmCancelPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    setPendingConfirmation({
      title: `Cancel ${escapeHtml(purchaseOrder.po_number)}?`,
      message: purchaseOrder.source === 'manual' ? 'This manual purchase order will be cancelled.' : 'Linked requests will return to requested status.',
      confirmLabel: 'Cancel PO',
      onConfirm: () => void handleCancelPurchaseOrder(purchaseOrder),
    });
  };

  const handleCancelPurchaseOrder = async (purchaseOrder: PurchaseOrder) => {
    setPendingConfirmation(null);
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
    setSupplierProductSearch('');
    setSupplierProductPage(1);
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

  const getPurchaseOrderDetailHtml = (purchaseOrder: PurchaseOrder) => {
    const rows = (purchaseOrder.items || []).map((item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(item.product_name)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.quantity_ordered}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.quantity_received}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(purchaseOrder.po_number)}</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px;">
        <h1 style="margin:0 0 8px 0;">Purchase Order ${escapeHtml(purchaseOrder.po_number)}</h1>
        <p style="margin:0 0 4px 0;">Supplier: ${escapeHtml(purchaseOrder.supplier?.name || 'Unknown supplier')}</p>
        <p style="margin:0 0 4px 0;">Status: ${purchaseOrder.status.replace(/_/g, ' ')}</p>
        <p style="margin:0 0 16px 0;">Total: ${formatCurrency(purchaseOrder.total_amount)}</p>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th><th style="padding:8px;border:1px solid #ddd;">Qty</th><th style="padding:8px;border:1px solid #ddd;">Unit</th><th style="padding:8px;border:1px solid #ddd;">Received</th><th style="padding:8px;border:1px solid #ddd;">Line Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>`;
  };

  const handlePrintPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (!printWindow) {
      toast.error('Unable to open print window.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(getPurchaseOrderDetailHtml(purchaseOrder));
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadPurchaseOrderPdf = (purchaseOrder: PurchaseOrder) => {
    const lines = [
      `Purchase Order ${escapeHtml(purchaseOrder.po_number)}`,
      `Supplier: ${escapeHtml(purchaseOrder.supplier?.name || 'Unknown supplier')}`,
      `Status: ${purchaseOrder.status.replace(/_/g, ' ')}`,
      `Reorder date: ${formatDate(purchaseOrder.reorder_date)}`,
      `Expected delivery: ${formatDate(purchaseOrder.expected_delivery_date)}`,
      '',
      'Items:',
      ...(purchaseOrder.items || []).map((item, idx) => `${idx + 1}. ${escapeHtml(item.product_name)} | Qty ${item.quantity_ordered} | Unit ${formatCurrency(item.unit_price)} | Total ${formatCurrency(item.total_price)}`),
      '',
      `PO Total: ${formatCurrency(purchaseOrder.total_amount)}`,
    ];

    const maxVisibleLines = 44;
    const cappedLines = lines.length > maxVisibleLines
      ? [...lines.slice(0, maxVisibleLines - 1), `... ${lines.length - (maxVisibleLines - 1)} more line(s). Use Print for full layout.`]
      : lines;

    const contentLines = cappedLines
      .map((line, index) => `BT /F1 11 Tf 50 ${770 - (index * 16)} Td (${escapePdfText(line)}) Tj ET`)
      .join('\n');
    const stream = `${contentLines}\n`;
    const objects = [
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
      '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      `5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += `${obj}\n`;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${escapeHtml(purchaseOrder.po_number)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Purchase order PDF downloaded.');
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'requests', label: 'Current Requests', count: currentRequests.length },
    { key: 'request_history', label: 'Request History' },
    {
      key: 'schedule',
      label: 'Upcoming Scheduled Re-orders',
      count: upcomingReorders.filter((item) =>
        !!item.next_reorder_date
        && purchaseOrders.some((po) =>
          po.source === 'scheduled'
          && po.supplier_id === item.supplier.id
          && po.reorder_date === item.next_reorder_date
          && po.status === 'open')
      ).length,
    },
    { key: 'purchase_orders', label: 'Purchase Orders', count: purchaseOrders.filter((po) => po.status === 'open' || po.status === 'placed').length },
  ];

  const filteredSupplierProducts = supplierProducts.filter((product) => {
    const search = supplierProductSearch.trim().toLowerCase();
    if (!search) return true;
    return [product.product_name, product.product_id, product.product_type, product.supplier_sku, product.notes]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
  const supplierProductTotalPages = Math.max(1, Math.ceil(filteredSupplierProducts.length / ITEM_SELECTOR_PAGE_SIZE));
  const paginatedSupplierProducts = filteredSupplierProducts.slice((supplierProductPage - 1) * ITEM_SELECTOR_PAGE_SIZE, supplierProductPage * ITEM_SELECTOR_PAGE_SIZE);

  const selectedRequestSupplierTotalPages = selectedRequestSupplier ? Math.max(1, Math.ceil(selectedRequestSupplier.requests.length / PAGE_SIZE)) : 1;
  const selectedRequestSupplierRequests = selectedRequestSupplier ? selectedRequestSupplier.requests.slice((requestSupplierPage - 1) * PAGE_SIZE, requestSupplierPage * PAGE_SIZE) : [];
  const selectedPurchaseOrderSupplierTotalPages = selectedPurchaseOrderSupplier ? Math.max(1, Math.ceil(selectedPurchaseOrderSupplier.purchaseOrders.length / PAGE_SIZE)) : 1;
  const selectedPurchaseOrderSupplierPurchaseOrders = selectedPurchaseOrderSupplier ? selectedPurchaseOrderSupplier.purchaseOrders.slice((purchaseOrderSupplierPage - 1) * PAGE_SIZE, purchaseOrderSupplierPage * PAGE_SIZE) : [];
  const normalizedTabSearch = tabSearchTerm.trim().toLowerCase();

  const filterRequestGroups = useCallback((groups: Record<string, { supplierName: string; requests: RestockRequest[] }>, mode: 'current' | 'history') => Object.entries(groups).flatMap(([supplierId, group]) => {
    const filteredRequests = group.requests.filter((request) => {
      const matchesSearch = !normalizedTabSearch || [request.request_number, request.supplier?.name, ...(request.items || []).flatMap((item) => [item.product_name, item.product_type, item.notes])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedTabSearch));
      if (!matchesSearch) return false;

      if (mode === 'current') {
        if (requestTabFilter === 'requested') return request.status === 'requested';
        if (requestTabFilter === 'linked_to_po') return request.status === 'linked_to_po';
        if (requestTabFilter === 'linked_po_placed') return requestLinkedToPlacedPo(request);
      }

      if (mode === 'history') {
        if (requestHistoryTabFilter === 'received') return request.status === 'received';
        if (requestHistoryTabFilter === 'cancelled') return request.status === 'cancelled';
      }

      return true;
    });

    return filteredRequests.length > 0 ? [[supplierId, { ...group, requests: filteredRequests }] as const] : [];
  }), [normalizedTabSearch, requestHistoryTabFilter, requestLinkedToPlacedPo, requestTabFilter]);


  const requestSearchMatches = useMemo(() => currentRequests.filter((request) => {
    if (!normalizedTabSearch) return false;
    return [request.request_number, request.supplier?.name, request.pharmacist?.full_name, request.pharmacist?.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedTabSearch));
  }).slice(0, 8), [currentRequests, normalizedTabSearch]);

  const requestHistorySearchMatches = useMemo(() => requestHistory.filter((request) => {
    if (!normalizedTabSearch) return false;
    return [request.request_number, request.supplier?.name, request.pharmacist?.full_name, request.pharmacist?.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedTabSearch));
  }).slice(0, 8), [requestHistory, normalizedTabSearch]);

  const scheduleSearchMatches = useMemo(() => upcomingReorders.filter((item) => {
    if (!normalizedTabSearch) return false;
    return [item.supplier.name, item.schedule_label, item.next_reorder_date]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedTabSearch));
  }).slice(0, 8), [normalizedTabSearch, upcomingReorders]);

  const purchaseOrderSearchMatches = useMemo(() => purchaseOrders
    .filter((po) => po.status === activePurchaseOrderStatus)
    .filter((po) => {
      if (!normalizedTabSearch) return false;
      return [po.po_number, po.supplier?.name, po.status, po.source]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedTabSearch));
    }).slice(0, 8), [activePurchaseOrderStatus, normalizedTabSearch, purchaseOrders]);

  useEffect(() => {
    setSelectedRequest((current) => current ? requests.find((request) => request.id === current.id) || null : null);
    setPlacingPurchaseOrder((current) => current ? purchaseOrders.find((purchaseOrder) => purchaseOrder.id === current.id) || current : null);
    setReceivingPurchaseOrder((current) => current ? purchaseOrders.find((purchaseOrder) => purchaseOrder.id === current.id) || current : null);
    setEditingPurchaseOrder((current) => current ? purchaseOrders.find((purchaseOrder) => purchaseOrder.id === current.id) || current : null);
    setSelectedPurchaseOrder((current) => current ? purchaseOrders.find((purchaseOrder) => purchaseOrder.id === current.id) || null : null);
    setSelectedRequestSupplier((current) => {
      if (!current) return null;
      const source = current.mode === 'current' ? requestsBySupplier : requestHistoryBySupplier;
      const updated = source[current.supplierId];
      return updated ? { ...current, supplierName: updated.supplierName, requests: updated.requests } : null;
    });
    setSelectedPurchaseOrderSupplier((current) => {
      if (!current) return null;
      const updated = purchaseOrdersByStatusAndSupplier[current.status][current.supplierId];
      return updated ? { ...current, supplierName: updated.supplierName, purchaseOrders: updated.purchaseOrders } : null;
    });
  }, [purchaseOrders, purchaseOrdersByStatusAndSupplier, requestHistoryBySupplier, requests, requestsBySupplier]);

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
            Unscheduled Purchase Order
          </button>
        </div>
        <div className="relative border-b border-gray-200 px-4 py-3">
          <input
            value={tabSearchTerm}
            onChange={(event) => setTabSearchTerm(event.target.value)}
            placeholder="Search this tab..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm align-top focus:outline-none align-top focus:ring-2 focus:ring-green-600"
          />
          {normalizedTabSearch && (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {activeTab === 'requests' && (
                requestSearchMatches.length > 0 ? requestSearchMatches.map((request) => (
                  <button key={request.id} type="button" onClick={() => setSelectedRequest(request)} className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {request.request_number} · {request.supplier?.name || 'Unknown supplier'}
                  </button>
                )) : <p className="px-3 py-2 text-sm text-gray-500">No matching requests.</p>
              )}
              {activeTab === 'request_history' && (
                requestHistorySearchMatches.length > 0 ? requestHistorySearchMatches.map((request) => (
                  <button key={request.id} type="button" onClick={() => setSelectedRequest(request)} className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {request.request_number} · {request.supplier?.name || 'Unknown supplier'}
                  </button>
                )) : <p className="px-3 py-2 text-sm text-gray-500">No matching historical requests.</p>
              )}
              {activeTab === 'schedule' && (
                scheduleSearchMatches.length > 0 ? scheduleSearchMatches.map((item) => (
                  <button key={item.supplier.id} type="button" onClick={() => setExpandedScheduleSupplierId(item.supplier.id)} className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {item.supplier.name} · {item.schedule_label} · {formatDate(item.next_reorder_date)}
                  </button>
                )) : <p className="px-3 py-2 text-sm text-gray-500">No matching scheduled re-orders.</p>
              )}
              {activeTab === 'purchase_orders' && (
                purchaseOrderSearchMatches.length > 0 ? purchaseOrderSearchMatches.map((po) => (
                  <button key={po.id} type="button" onClick={() => viewPurchaseOrder(po)} className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50">
                    {po.po_number} · {po.supplier?.name || 'Unknown supplier'} · {po.status}
                  </button>
                )) : <p className="px-3 py-2 text-sm text-gray-500">No matching purchase orders.</p>
              )}
            </div>
          )}
        </div>


        <div className="border-b border-gray-200 px-4 py-3">
          {activeTab === 'requests' && (
            <select value={requestTabFilter} onChange={(event) => setRequestTabFilter(event.target.value as 'all' | 'requested' | 'linked_to_po' | 'linked_po_placed')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-auto">
              <option value="all">All current request statuses</option>
              <option value="requested">Requested only</option>
              <option value="linked_to_po">Linked to PO only</option>
              <option value="linked_po_placed">Linked to placed PO only</option>
            </select>
          )}
          {activeTab === 'request_history' && (
            <select value={requestHistoryTabFilter} onChange={(event) => setRequestHistoryTabFilter(event.target.value as 'all' | 'received' | 'cancelled')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-auto">
              <option value="all">All historical statuses</option>
              <option value="received">Received only</option>
              <option value="cancelled">Cancelled only</option>
            </select>
          )}
          {activeTab === 'schedule' && (
            <select value={scheduleTabFilter} onChange={(event) => setScheduleTabFilter(event.target.value as 'all' | 'with_open_po' | 'without_open_po')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 sm:w-auto">
              <option value="all">All scheduled suppliers</option>
              <option value="with_open_po">With open scheduled PO</option>
              <option value="without_open_po">Without open scheduled PO</option>
            </select>
          )}
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
                  filterRequestGroups(requestsBySupplier, 'current').map(([supplierId, group]) => {
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
                  filterRequestGroups(requestHistoryBySupplier, 'history').map(([supplierId, group]) => (
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
                  upcomingReorders.filter((item) => {
                    if (scheduleTabFilter === 'with_open_po') return !!openPurchaseOrdersBySupplier[item.supplier.id];
                    if (scheduleTabFilter === 'without_open_po') return !openPurchaseOrdersBySupplier[item.supplier.id];
                    return true;
                  }).map((item) => {
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
                    const statusCount = statusTab.status === 'on_hold' ? heldRequests.length + heldItems.length : purchaseOrders.filter((po) => po.status === statusTab.status).length;
                    const showStatusCount = statusTab.status === 'open' || statusTab.status === 'placed' || statusTab.status === 'on_hold';
                    return (
                      <button key={statusTab.status} type="button" onClick={() => setActivePurchaseOrderStatus(statusTab.status)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activePurchaseOrderStatus === statusTab.status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {statusTab.label}{showStatusCount ? ` (${statusCount})` : ''}
                      </button>
                    );
                  })}
                </div>
                {activePurchaseOrderStatus === 'on_hold' ? (
                  heldRequests.length === 0 && heldItems.length === 0 ? (
                    <EmptyState icon={Package} title="No requests or items on hold" subtitle="Requests and orphaned line items put on hold will appear here until linked to an open PO." />
                  ) : (
                    <div className="space-y-4">
                      {heldRequests.map((request) => (
                        <section key={request.id} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="break-words font-semibold text-orange-950">Held request {request.request_number}</h3>
                              <p className="mt-1 break-words text-sm text-orange-800">{request.supplier?.name || 'Unknown supplier'} · {(request.items || []).length} item(s) · {formatCurrency(request.total_amount)}</p>
                            </div>
                            <button type="button" onClick={() => openReleaseHeldRequest(request)} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700">Link to PO</button>
                          </div>
                        </section>
                      ))}
                      {heldItems.map((item) => (
                        <section key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="break-words font-semibold text-amber-950">Held item {item.product_name}</h3>
                              <p className="mt-1 break-words text-sm text-amber-800">Qty {item.quantity_requested} · Unit {formatCurrency(item.unit_price)} · Total {formatCurrency(item.total_price)}</p>
                            </div>
                            <button type="button" onClick={() => openReleaseHeldItem(item)} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700">Create request and link to PO</button>
                          </div>
                        </section>
                      ))}
                    </div>
                  )
                ) : purchaseOrders.length === 0 ? (
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={handleCreatePurchaseOrder} className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Generate Purchase Order</h2>
              <button type="button" onClick={() => setShowPoModal(false)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Supplier *</label>
                <select
                  value={poForm.supplier_id}
                  onChange={(event) => { setPoForm({ ...poForm, supplier_id: event.target.value }); setManualPoItems([]); setSupplierProductSearch(''); setSupplierProductPage(1); void loadSupplierProductsForPo(event.target.value); }}
                  required
                  disabled={poFormLocked}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 align-top focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 align-top focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              {!poFormLocked && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">PO Source</label>
                  <select
                    value={poForm.source}
                    onChange={(event) => setPoForm({ ...poForm, source: event.target.value as 'manual' | 'scheduled', is_custom_reorder_date: event.target.value === 'manual' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
                  <input
                    type="search"
                    value={supplierProductSearch}
                    onChange={(event) => { setSupplierProductSearch(event.target.value); setSupplierProductPage(1); }}
                    placeholder="Search supplier items"
                    className="mt-3 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
                  />
                  <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-white p-2">
                    {supplierProducts.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">No active products are linked to this supplier.</p>
                    ) : filteredSupplierProducts.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">No linked supplier products match your search.</p>
                    ) : paginatedSupplierProducts.map((product) => (
                      <button key={product.id} type="button" onClick={() => addManualPoItem(product)} disabled={manualPoItems.some((item) => item.supplier_product_id === product.id)} className="flex w-full items-center justify-between rounded border border-gray-200 p-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                        <span>{product.product_name || product.product_id}</span>
                        <span>{formatCurrency(product.supplier_unit_price)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-blue-900">
                    <button type="button" onClick={() => setSupplierProductPage((page) => Math.max(1, page - 1))} disabled={supplierProductPage === 1} className="rounded border border-blue-200 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                    <span>Page {supplierProductPage} of {supplierProductTotalPages} · 15 per page</span>
                    <button type="button" onClick={() => setSupplierProductPage((page) => Math.min(supplierProductTotalPages, page + 1))} disabled={supplierProductPage === supplierProductTotalPages} className="rounded border border-blue-200 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Next</button>
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none align-top focus:ring-2 focus:ring-green-600"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={handlePlacePurchaseOrder} className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={handleEditPurchaseOrder} className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit {editingPurchaseOrder.po_number}</h2>
                <p className="text-sm text-gray-600">Changes to linked purchase order lines also update the matching restock request items.</p>
              </div>
              <button type="button" onClick={() => setEditingPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pr-1">
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
              <input
                type="search"
                value={supplierProductSearch}
                onChange={(event) => { setSupplierProductSearch(event.target.value); setSupplierProductPage(1); }}
                placeholder="Search supplier items"
                className="mt-3 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
              />
              <div className="mt-3 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-white p-2">
                {supplierProducts.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">No active products are linked to this supplier.</p>
                ) : filteredSupplierProducts.length === 0 ? (
                  <p className="p-2 text-sm text-gray-500">No linked supplier products match your search.</p>
                ) : paginatedSupplierProducts.map((product) => {
                  const alreadyAdded = editItems.some((item) => item.product_id === product.product_id && item.product_type === product.product_type);
                  return (
                    <button key={product.id} type="button" onClick={() => addProductToEditPurchaseOrder(product)} disabled={alreadyAdded} className="flex w-full items-center justify-between rounded border border-gray-200 p-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
                      <span>{product.product_name || product.product_id}</span>
                      <span>{alreadyAdded ? 'Added' : formatCurrency(product.supplier_unit_price)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-blue-900">
                <button type="button" onClick={() => setSupplierProductPage((page) => Math.max(1, page - 1))} disabled={supplierProductPage === 1} className="rounded border border-blue-200 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <span>Page {supplierProductPage} of {supplierProductTotalPages} · 15 per page</span>
                <button type="button" onClick={() => setSupplierProductPage((page) => Math.min(supplierProductTotalPages, page + 1))} disabled={supplierProductPage === supplierProductTotalPages} className="rounded border border-blue-200 px-2 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none align-top focus:ring-2 focus:ring-blue-600"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={handleReceivePurchaseOrder} className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Receive {receivingPurchaseOrder.po_number}</h2>
                <p className="text-sm text-gray-600">Mark each line item as received or not received before completing the purchase order.</p>
              </div>
              <button type="button" onClick={() => setReceivingPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pr-1">
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
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 align-top focus:outline-none focus:ring-2 focus:ring-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
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
              <div><span className="text-gray-500">Status</span><p className="font-medium text-gray-900">{selectedRequest.status.replace(/_/g, ' ')}</p>{requestLinkedToPlacedPo(selectedRequest) && <p className="mt-1 text-xs font-semibold text-purple-700">Order placed</p>}</div>
              <div><span className="text-gray-500">Total</span><p className="font-medium text-gray-900">{formatCurrency(selectedRequest.total_amount)}</p></div>
              <div><span className="text-gray-500">Requested</span><p className="font-medium text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p></div>
              {selectedRequest.actual_delivery_date && <div><span className="text-gray-500">Received</span><p className="font-medium text-gray-900">{formatDate(selectedRequest.actual_delivery_date)}</p></div>}
            </div>
            <div className="mt-4 divide-y rounded-lg border border-gray-200">
              {(selectedRequest.items || []).map((item) => (
                <div key={item.id} className="grid min-w-0 gap-2 p-3 text-sm md:grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_auto]">
                  <span className="min-w-0 break-words font-medium text-gray-900">{item.product_name}</span>
                  <span className="break-words">Qty: {item.quantity_requested}</span>
                  <span className="break-words">Unit: {formatCurrency(item.unit_price)}</span>
                  <span className="break-words">Total: {formatCurrency(item.total_price)}</span>
                  {selectedRequest.status === 'requested' && (
                    <button type="button" onClick={() => handlePutItemOnHold(item)} disabled={actionLoading} className="rounded border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:bg-gray-100">
                      Hold item
                    </button>
                  )}
                </div>
              ))}
            </div>
            {selectedRequest.status === 'requested' && (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => handlePutRequestOnHold(selectedRequest)} disabled={actionLoading} className="w-full rounded-lg border border-orange-200 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50 disabled:bg-gray-100">
                  Put Request On Hold
                </button>
                <button type="button" onClick={() => confirmCancelRequest(selectedRequest)} disabled={actionLoading} className="w-full rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100">
                  Cancel Request
                </button>
              </div>
            )}
            {selectedRequest.status === 'on_hold' && (
              <button type="button" onClick={() => openReleaseHeldRequest(selectedRequest)} disabled={actionLoading} className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-gray-300">
                Remove From Hold and Link to PO
              </button>
            )}
          </div>
        </div>
      )}

      {selectedRequestSupplier && !selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="break-words font-semibold text-gray-900">{request.request_number}</span><span className={`rounded-full border px-2 py-1 text-xs font-medium ${getRestockStatusClasses(request.status)}`}>{request.status.replace(/_/g, ' ')}</span>{requestLinkedToPlacedPo(request) && <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">Order placed</span>}</div>
                    <p className="mt-1 break-words text-sm text-gray-600">{(request.items || []).length} item(s) · {formatCurrency(request.total_amount)} · Submitted by {request.pharmacist?.full_name || request.pharmacist?.email || 'Unknown user'} · Requested {new Date(request.created_at).toLocaleDateString()}</p>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
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
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2"><h3 className="break-words font-semibold text-gray-900">{po.po_number}</h3><span className={`rounded-full border px-2 py-1 text-xs font-medium ${getPurchaseOrderStatusClasses(po.status)}`}>{po.status}</span></div>
                      <p className="mt-1 break-words text-sm text-gray-600">{po.source === 'manual' ? 'Manual PO' : 'Scheduled PO'} · Re-order date {formatDate(po.reorder_date)} · Expected delivery {formatDate(po.expected_delivery_date)} · {(po.items || []).length} line item(s) · {formatCurrency(po.total_amount)}</p>
                    </div>
                    {(po.status === 'open' || po.status === 'placed') && (
                      <div className="flex flex-wrap gap-2">
                        {po.status === 'open' && <><button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openEditModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:bg-gray-100"><Edit2 className="h-4 w-4" /> Edit</button><button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openPlaceModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:bg-gray-300"><Send className="h-4 w-4" /> Place Order</button></>}
                        {po.status === 'placed' && <button onClick={(event) => { event.stopPropagation(); setSelectedPurchaseOrderSupplier(null); openReceiveModal(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"><Truck className="h-4 w-4" /> Receive</button>}
                        <button onClick={(event) => { event.stopPropagation(); confirmCancelPurchaseOrder(po); }} disabled={actionLoading} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:bg-gray-100"><XCircle className="h-4 w-4" /> Cancel</button>
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


      {releaseTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <form onSubmit={handleReleaseFromHold} className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Release from hold</h2>
                <p className="text-sm text-gray-600">{releaseTarget.label}</p>
              </div>
              <button type="button" onClick={() => setReleaseTarget(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Choose an open manual or scheduled PO for this supplier. Orphaned held items will also be attached to a new system-generated restock request.
            </p>
            <label className="mb-1 block text-sm font-medium text-gray-700">Open purchase order *</label>
            <select
              value={releasePurchaseOrderId}
              onChange={(event) => setReleasePurchaseOrderId(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-600"
            >
              <option value="">Select an open PO</option>
              {purchaseOrders.filter((po) => po.status === 'open' && po.supplier_id === releaseTarget.supplierId).map((po) => (
                <option key={po.id} value={po.id}>{po.po_number} · {po.source === 'manual' ? 'Manual' : 'Scheduled'} · {formatDate(po.reorder_date)}</option>
              ))}
            </select>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={actionLoading || !releasePurchaseOrderId} className="flex-1 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:bg-gray-300">
                {actionLoading ? 'Linking...' : 'Link to PO'}
              </button>
              <button type="button" onClick={() => setReleaseTarget(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!pendingConfirmation}
        title={pendingConfirmation?.title || ''}
        message={pendingConfirmation?.message || ''}
        confirmLabel={pendingConfirmation?.confirmLabel}
        loading={actionLoading}
        onConfirm={() => pendingConfirmation?.onConfirm()}
        onCancel={() => setPendingConfirmation(null)}
      />

      {selectedPurchaseOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 p-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">{selectedPurchaseOrder.po_number}</h2>
              <button type="button" onClick={() => setSelectedPurchaseOrder(null)} className="rounded p-1 hover:bg-gray-100"><XCircle className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-gray-600">{selectedPurchaseOrder.supplier?.name} · {selectedPurchaseOrder.source === 'manual' ? 'Manual PO' : 'Scheduled PO'} · Status: {selectedPurchaseOrder.status} · Total {formatCurrency(selectedPurchaseOrder.total_amount)}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => handlePrintPurchaseOrder(selectedPurchaseOrder)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Printer className="h-4 w-4" />
                Print Purchase Order
              </button>
              <button type="button" onClick={() => handleDownloadPurchaseOrderPdf(selectedPurchaseOrder)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                <Download className="h-4 w-4" />
                Download as PDF
              </button>
            </div>
            <div className="mt-4 divide-y rounded-lg border border-gray-200">
              {(selectedPurchaseOrder.items || []).map((item) => (
                <div key={item.id} className="grid min-w-0 gap-2 p-3 text-sm md:grid-cols-[minmax(0,2fr)_minmax(5rem,1fr)_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(6rem,1fr)]">
                  <span className="min-w-0 break-words font-medium text-gray-900">{item.product_name}</span>
                  <span className="break-words">Ordered: {item.quantity_ordered}</span>
                  <span className="break-words">Unit: {formatCurrency(item.unit_price)}</span>
                  <span className="break-words">Received: {item.quantity_received}</span>
                  <span className="break-words">{formatCurrency(item.total_price)}</span>
                  {(selectedPurchaseOrder.status === 'open' || selectedPurchaseOrder.status === 'placed') && item.restock_item_id && (
                    <button
                      type="button"
                      onClick={() => void handlePutPurchaseOrderItemOnHold(item.restock_item_id as string, item.product_name)}
                      disabled={actionLoading}
                      className="rounded border border-orange-200 px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:bg-gray-100"
                    >
                      Hold item
                    </button>
                  )}
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

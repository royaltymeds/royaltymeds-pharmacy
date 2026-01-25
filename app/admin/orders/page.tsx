'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Order, OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { ChevronDown, Filter, Search, FileText, Check, X, AlertTriangle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllOrders, getAdminOrderWithItems, updateOrderStatus, updateOrderShipping, checkInventoryAvailability, updateInventoryOnShipment } from '@/app/actions/orders';
import { verifyPayment } from '@/app/actions/payments';
import { formatCurrency } from '@/lib/utils/currency';

const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderWithItems>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [editingShipping, setEditingShipping] = useState<string | null>(null);
  const [savingShipping, setSavingShipping] = useState<string | null>(null);
  const [shippingValues, setShippingValues] = useState<Record<string, string>>({});
  const [inventoryWarnings, setInventoryWarnings] = useState<Record<string, Array<{ drug_name: string; required: number; available: number }>>>({});
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string>('');
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const allOrders = await getAllOrders();
        setOrders(allOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter ? order.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Load order details when expanded
  const handleExpandOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    // Set as selected when expanding
    setSelectedOrderId(orderId);

    if (!orderDetails[orderId]) {
      try {
        const details = await getAdminOrderWithItems(orderId);
        setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
        
        // Check inventory availability for this order
        const { isAvailable, missingItems } = await checkInventoryAvailability(orderId);
        if (!isAvailable) {
          setInventoryWarnings((prev) => ({
            ...prev,
            [orderId]: missingItems,
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        return;
      }
    }

    setExpandedOrderId(orderId);
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      // If changing to "shipped", update inventory
      if (newStatus === 'shipped') {
        await updateInventoryOnShipment(orderId);
      }
      
      await updateOrderStatus(orderId, newStatus as Order['status']);
      
      // Update the order status in the list
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
        )
      );
      
      // Clear cached details to close the expanded view
      setOrderDetails((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      
      // Reset the expanded order ID to collapse the card, but keep it selected
      setExpandedOrderId(null);
      // Keep selectedOrderId to maintain the highlight
      
      // Show success toast
      toast.success(`Order status updated to ${getStatusLabel(newStatus)}!`, {
        duration: 3000,
        position: 'top-right',
      });
      
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      toast.error(err instanceof Error ? err.message : 'Failed to update status', {
        duration: 3000,
        position: 'top-right',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || '#6B7280';
  };

  const handleUpdateShipping = async (orderId: string) => {
    try {
      const newAmount = parseFloat(shippingValues[orderId] || '0');
      if (newAmount < 0) {
        setError('Shipping amount cannot be negative');
        return;
      }
      
      setSavingShipping(orderId);
      await updateOrderShipping(orderId, newAmount);
      
      // Update orders list
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            // Calculate subtotal (items + tax, without shipping)
            const subtotal = order.total_amount - order.shipping_amount;
            // New total = subtotal + new shipping
            const newTotal = subtotal + newAmount;
            return { ...order, shipping_amount: newAmount, total_amount: newTotal };
          }
          return order;
        })
      );
      
      // Update cached details
      if (orderDetails[orderId]) {
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            shipping_amount: newAmount,
            total_amount: (prev[orderId].total_amount - prev[orderId].shipping_amount + newAmount),
          },
        }));
      }
      
      setError('');
      setShippingValues((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setEditingShipping(null);
      setSavingShipping(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping');
      setSavingShipping(null);
    }
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  const handleVerifyPayment = async (orderId: string) => {
    setVerifyingPayment(orderId);
    try {
      await verifyPayment(orderId);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'payment_verified', payment_status: 'paid' } : order
        )
      );
      // Update cached details
      if (orderDetails[orderId]) {
        setOrderDetails((prev) => ({
          ...prev,
          [orderId]: {
            ...prev[orderId],
            status: 'payment_verified',
            payment_status: 'paid',
          },
        }));
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setVerifyingPayment(null);
    }
  };

  const statuses = ['pending', 'confirmed', 'payment_pending', 'payment_verified', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-sm md:text-base text-gray-600">Manage and track all customer orders</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by order number or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter size={18} />
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter(null)}
                className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm ${
                  statusFilter === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 md:px-4 py-2 rounded-lg transition-colors text-xs md:text-sm ${
                    statusFilter === status
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: statusFilter === status ? getStatusColor(status) : undefined,
                  }}
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs md:text-sm text-gray-600">
            Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const isSelected = selectedOrderId === order.id;
              const details = orderDetails[order.id];

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'
                  }`}
                >
                  {/* Order Header */}
                  <button
                    onClick={() => handleExpandOrder(order.id)}
                    className="w-full p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition-colors gap-4 md:gap-6"
                  >
                    <div className="flex-grow text-left w-full md:w-auto">
                      <div className="flex flex-col md:flex-row md:items-center md:gap-2 gap-3">
                        <div className="md:flex-none">
                          <h3 className="font-semibold text-gray-900 text-base md:text-lg break-words">
                            {order.order_number}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">
                            Customer: {order.customer_name || order.user_id}
                          </p>
                        </div>

                        <div className="text-left md:text-left">
                          <p className="text-xs md:text-sm text-gray-600 mb-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status and Expand */}
                    <div className="flex items-center gap-3 w-full md:w-auto md:ml-6">
                      <div
                        className="px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-white flex-1 md:flex-none text-center md:text-left"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusLabel(order.status)}
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform flex-shrink-0 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Order Details */}
                  {isExpanded && details && (
                    <div className="border-t border-gray-200 p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50">
                      {/* Inventory Warning */}
                      {inventoryWarnings[order.id] && inventoryWarnings[order.id].length > 0 && !['processing', 'shipped', 'delivered', 'cancelled'].includes(order.status) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-yellow-900 mb-2 text-sm md:text-base">
                                Insufficient Inventory
                              </h4>
                              <ul className="space-y-1 text-xs md:text-sm text-yellow-800">
                                {inventoryWarnings[order.id].map((item, idx) => (
                                  <li key={idx}>
                                    <strong>{item.drug_name}</strong>: Need {item.required} units, only {item.available} available
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Status Change */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {statuses.map((status) => {
                            const isCurrentStatus = order.status === status;
                            const isUpdating = updatingStatus === order.id;
                            const hasInventoryWarning = inventoryWarnings[order.id] && inventoryWarnings[order.id].length > 0;
                            const isShippingOrProcessing = status === 'shipped' || status === 'processing';
                            const isDelivered = order.status === 'delivered';
                            const isDisabled = isUpdating || isCurrentStatus || (hasInventoryWarning && isShippingOrProcessing) || isDelivered;
                            
                            return (
                              <div key={status} className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(order.id, status)}
                                  disabled={isDisabled}
                                  className={`px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-xs md:text-sm flex items-center gap-2 ${
                                    isCurrentStatus
                                      ? 'ring-2 ring-offset-2'
                                      : 'hover:opacity-90'
                                  } ${
                                    isDisabled
                                      ? 'opacity-50 cursor-not-allowed'
                                      : 'opacity-100'
                                  }`}
                                  style={{
                                    backgroundColor: isDisabled ? '#9CA3AF' : getStatusColor(status),
                                    color: 'white',
                                  }}
                                >
                                  {isUpdating ? (
                                    <>
                                      <Loader className="w-3 h-3 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    getStatusLabel(status)
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Payment Information & Receipt */}
                      {order.receipt_url && (
                        <div className="bg-white rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm md:text-base flex items-center gap-2">
                                <FileText size={20} />
                                Payment Receipt
                              </h4>
                              <p className="text-xs md:text-sm text-gray-600 mt-1">
                                Status: <span className="font-medium">{order.payment_status}</span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Verify Button - Left side */}
                            <div className="md:col-span-2">
                              <button
                                onClick={() => handleVerifyPayment(order.id)}
                                disabled={verifyingPayment === order.id || order.payment_status === 'paid'}
                                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-auto"
                              >
                                {verifyingPayment === order.id ? (
                                  <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Verifying...
                                  </>
                                ) : order.payment_status === 'paid' ? (
                                  <>
                                    <Check size={16} />
                                    Payment Verified
                                  </>
                                ) : (
                                  <>
                                    <Check size={16} />
                                    Verify Payment
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Receipt Thumbnail - Right side */}
                            <div>
                              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-24 md:h-32">
                                {order.receipt_url.includes('.pdf') ? (
                                  <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center cursor-pointer hover:from-red-100 hover:to-red-200 transition"
                                    onClick={() => {
                                      setReceiptModalUrl(order.receipt_url || '');
                                      setReceiptModalOpen(true);
                                    }}>
                                    <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                                  </div>
                                ) : (
                                  <div 
                                    className="w-full h-full cursor-pointer hover:opacity-80 transition"
                                    onClick={() => {
                                      setReceiptModalUrl(order.receipt_url || '');
                                      setReceiptModalOpen(true);
                                    }}>
                                    <Image
                                      src={order.receipt_url}
                                      alt="Payment receipt"
                                      width={150}
                                      height={128}
                                      className="w-full h-full object-contain"
                                      unoptimized
                                    />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 text-center">Click to view receipt</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Items</h4>
                        <div className="space-y-3">
                          {details.items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-lg p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 text-sm md:text-base break-words">
                                  {item.drug_name}
                                </h5>
                                <p className="text-xs md:text-sm text-gray-600 mt-1">
                                  Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                </p>
                              </div>
                              <p className="text-lg md:text-lg font-bold text-gray-900">
                                {formatCurrency(item.unit_price * item.quantity)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="bg-white rounded-lg p-4 space-y-2 text-sm md:text-base">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span>
                            ${(
                              order.total_amount -
                              order.tax_amount -
                              order.shipping_amount
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Tax (10%)</span>
                          <span>{formatCurrency(order.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 items-center">
                          <span>Delivery/Shipping</span>
                          {editingShipping === order.id ? (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={shippingValues[order.id] ?? order.shipping_amount}
                                onChange={(e) => setShippingValues({ ...shippingValues, [order.id]: e.target.value })}
                                step="0.01"
                                min="0"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <button
                                onClick={() => handleUpdateShipping(order.id)}
                                disabled={savingShipping === order.id}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
                              >
                                {savingShipping === order.id ? (
                                  <>
                                    <Loader className="w-3 h-3 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingShipping(null);
                                  setShippingValues((prev) => {
                                    const updated = { ...prev };
                                    delete updated[order.id];
                                    return updated;
                                  });
                                }}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingShipping(order.id);
                                setShippingValues({ ...shippingValues, [order.id]: order.shipping_amount.toString() });
                              }}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {formatCurrency(order.shipping_amount)}
                              <span className="text-xs">(edit)</span>
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between text-base md:text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                            Shipping Address
                          </h5>
                          <p className="text-xs md:text-sm text-gray-600 whitespace-pre-wrap break-words">
                            {order.shipping_address}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                            Billing Address
                          </h5>
                          <p className="text-xs md:text-sm text-gray-600 whitespace-pre-wrap break-words">
                            {order.billing_address}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
                            Order Notes
                          </h5>
                          <p className="text-xs md:text-sm text-gray-600">{order.notes}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="bg-white rounded-lg p-4 text-xs text-gray-600 space-y-1">
                        <p>Created: {new Date(order.created_at).toLocaleString()}</p>
                        <p>Updated: {new Date(order.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No orders found matching your filters.</p>
          </div>
        )}

        {/* Receipt Modal */}
        {receiptModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Receipt</h2>
                <button
                  onClick={() => setReceiptModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 md:p-6">
                {receiptModalUrl.includes('.pdf') ? (
                  <div className="w-full h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-4">PDF Document</p>
                      <a
                        href={receiptModalUrl}
                        download
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <Image
                      src={receiptModalUrl}
                      alt="Receipt"
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-lg"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

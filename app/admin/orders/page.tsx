'use client';

import React, { useEffect, useState } from 'react';
import { Order, OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { ChevronDown, Filter, Search } from 'lucide-react';
import { getAllOrders, getAdminOrderWithItems, updateOrderStatus } from '@/app/actions/orders';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderWithItems>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? order.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Load order details when expanded
  const handleExpandOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    if (!orderDetails[orderId]) {
      try {
        const details = await getAdminOrderWithItems(orderId);
        setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
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
      await updateOrderStatus(orderId, newStatus as Order['status']);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as Order['status'] } : order
        )
      );
      // Clear cached details to refetch on next expand
      setOrderDetails((prev) => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

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
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const details = orderDetails[order.id];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {/* Order Header */}
                  <button
                    onClick={() => handleExpandOrder(order.id)}
                    className="w-full p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition-colors gap-4 md:gap-6"
                  >
                    <div className="flex-grow text-left w-full md:w-auto">
                      <div className="flex flex-col md:flex-row md:items-center md:gap-6 gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base md:text-lg break-words">
                            {order.order_number}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 mt-1 break-words">
                            Customer: {order.user_id}
                          </p>
                        </div>

                        <div className="text-left md:text-right">
                          <p className="text-xs md:text-sm text-gray-600 mb-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xl md:text-2xl font-bold text-gray-900">
                            ${order.total_amount.toFixed(2)}
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
                      {/* Status Change */}
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(order.id, status)}
                              disabled={updatingStatus === order.id || order.status === status}
                              className={`px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-xs md:text-sm ${
                                order.status === status
                                  ? 'ring-2 ring-offset-2'
                                  : 'hover:opacity-80'
                              }`}
                              style={{
                                backgroundColor: getStatusColor(status),
                                color: 'white',
                                opacity: order.status === status ? 1 : 0.7,
                              }}
                            >
                              {updatingStatus === order.id ? 'Updating...' : getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>

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
                                  Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-lg md:text-lg font-bold text-gray-900">
                                ${(item.unit_price * item.quantity).toFixed(2)}
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
                          <span>${order.tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Shipping</span>
                          <span>${order.shipping_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base md:text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>${order.total_amount.toFixed(2)}</span>
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
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No orders found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

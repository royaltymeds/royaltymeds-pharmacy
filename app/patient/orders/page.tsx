'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { ChevronDown, Package, Calendar, DollarSign } from 'lucide-react';
import { getOrdersByUser, getOrderWithItems } from '@/app/actions/orders';

export default function PatientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderWithItems>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const userOrders = await getOrdersByUser();
        setOrders(userOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Load order details when expanded
  const handleExpandOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    if (!orderDetails[orderId]) {
      try {
        const details = await getOrderWithItems(orderId);
        setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        return;
      }
    }

    setExpandedOrderId(orderId);
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">View and track your orders</p>
          </div>
          <Link
            href="/store"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Place New Order
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
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
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-grow text-left">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={16} />
                              ${order.total_amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white`}
                          style={{
                            backgroundColor: ORDER_STATUS_COLORS[
                              order.status as keyof typeof ORDER_STATUS_COLORS
                            ],
                          }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <ChevronDown
                        size={24}
                        className={`text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Order Details */}
                  {isExpanded && details && (
                    <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Package size={20} />
                          Order Items
                        </h4>
                        <div className="space-y-4">
                          {details.items.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white rounded-lg p-4 flex gap-4"
                            >
                              <div className="flex-grow">
                                <h5 className="font-semibold text-gray-900">
                                  {item.drug_name}
                                </h5>
                                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                                  <span>Qty: {item.quantity}</span>
                                  <span>
                                    Unit Price: ${item.unit_price.toFixed(2)}
                                  </span>
                                  <span>
                                    Subtotal: ${(
                                      item.unit_price * item.quantity
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-white rounded-lg p-4 space-y-2">
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
                          <span>Tax</span>
                          <span>${order.tax_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Shipping</span>
                          <span>${order.shipping_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>${order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Shipping Address
                          </h5>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {order.shipping_address}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Billing Address
                          </h5>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {order.billing_address}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Order Notes
                          </h5>
                          <p className="text-sm text-gray-600">{order.notes}</p>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="bg-white rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-4">Order Timeline</h5>
                        <div className="space-y-3">
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <div className="w-0.5 h-8 bg-gray-300" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Order Placed</p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {order.status !== 'cancelled' && (
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    ['confirmed', 'processing', 'shipped', 'delivered'].includes(
                                      order.status
                                    )
                                      ? 'bg-blue-600'
                                      : 'bg-gray-300'
                                  }`}
                                />
                                <div className="w-0.5 h-8 bg-gray-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Order Confirmed</p>
                                <p className="text-sm text-gray-600">
                                  {['confirmed', 'processing', 'shipped', 'delivered'].includes(
                                    order.status
                                  )
                                    ? 'Confirmed'
                                    : 'Pending confirmation'}
                                </p>
                              </div>
                            </div>
                          )}
                          {['processing', 'shipped', 'delivered'].includes(order.status) && (
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-600" />
                                <div className="w-0.5 h-8 bg-gray-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Processing</p>
                                <p className="text-sm text-gray-600">
                                  Your order is being prepared
                                </p>
                              </div>
                            </div>
                          )}
                          {['shipped', 'delivered'].includes(order.status) && (
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-600" />
                                <div className="w-0.5 h-8 bg-gray-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Shipped</p>
                                <p className="text-sm text-gray-600">
                                  Your order is on the way
                                </p>
                              </div>
                            </div>
                          )}
                          {order.status === 'delivered' && (
                            <div className="flex gap-4">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              <div>
                                <p className="font-semibold text-gray-900">Delivered</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.updated_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No orders yet</p>
            <Link
              href="/store"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Link
            href="/patient/home"
            className="inline-block px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

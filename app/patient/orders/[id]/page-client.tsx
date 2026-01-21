'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { getOrderWithItems } from '@/app/actions/orders';
import { ChevronLeft, Package, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface OrderDetailsClientProps {
  orderId: string;
}

export default function OrderDetailsClient({ orderId }: OrderDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderWithItems(orderId);
        setOrder(orderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Error Loading Order</h2>
            </div>
            <p className="text-gray-600">{error || 'Order not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);
  const statusLabel = getStatusLabel(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </button>

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Order placed successfully!</span>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Order {order.order_number}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${
                statusColor === 'green'
                  ? 'bg-green-100 text-green-800'
                  : statusColor === 'blue'
                    ? 'bg-blue-100 text-blue-800'
                    : statusColor === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : statusColor === 'red'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
              }`}
            >
              <Package className="w-4 h-4" />
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-gray-900 font-medium">{item.drug_name}</td>
                    <td className="py-4 px-4 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-4 px-4 text-right text-gray-700">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-900 font-semibold">
                      ${Number(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>${Number(order.subtotal_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax (10%)</span>
                <span>${Number(order.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span>${Number(order.shipping_amount).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Billing */}
          <div className="space-y-4">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Shipping Address
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {order.shipping_address || 'Not provided'}
              </p>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Billing Address
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {order.billing_address || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Order Notes</h3>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/patient/orders"
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
          >
            Back to Orders
          </Link>
          <Link
            href="/store"
            className="flex-1 px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { getOrderWithItems, updateCustomShippingPaymentStatus } from '@/app/actions/orders';
import { getPaymentConfig } from '@/app/actions/payments';
import { PaymentConfig } from '@/lib/types/payments';
import { Package, Calendar, MapPin, CheckCircle, AlertCircle, Phone, MessageCircle, Mail, CreditCard, DollarSign } from 'lucide-react';
import { FygaroPaymentModal } from '@/app/patient/components/FygaroPaymentModal';
import { BankTransferModal } from '@/app/patient/components/BankTransferModal';

interface OrderDetailsClientProps {
  orderId: string;
}

export default function OrderDetailsClient({ orderId }: OrderDetailsClientProps) {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFygaroModal, setShowFygaroModal] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [customShippingPaymentType, setCustomShippingPaymentType] = useState<'cod' | 'online' | null>(null);
  const [bankConfig, setBankConfig] = useState<PaymentConfig | null>(null);
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

  // Load payment config
  useEffect(() => {
    const loadPaymentConfig = async () => {
      try {
        const config = await getPaymentConfig();
        setBankConfig(config);
      } catch (err) {
        console.error('Failed to load payment config:', err);
      }
    };

    loadPaymentConfig();
  }, []);

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status;
  };

  const getStatusColor = (status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || 'gray';
  };

  const hasItemsRequiringConfirmation = () => {
    return order?.items?.some((item) => item.pharm_confirm === true) ?? false;
  };

  const shouldShowPaymentButton = () => {
    // Show payment button for orders without items requiring confirmation and payment not yet completed
    return !hasItemsRequiringConfirmation() && order?.payment_status !== 'paid';
  };

  const handleCustomShippingPaymentOnline = async () => {
    try {
      // Mark that the custom shipping will be paid online
      await updateCustomShippingPaymentStatus(order!.id, true);
      setCustomShippingPaymentType('online');
      // Open Fygaro modal for payment - it will use shipping_custom_rate as amount
      setShowFygaroModal(true);
    } catch (err) {
      console.error('Failed to record shipping payment method:', err);
    }
  };

  const handleCustomShippingPaymentCOD = async () => {
    try {
      // Mark that the custom shipping will be paid on delivery
      await updateCustomShippingPaymentStatus(order!.id, false);
      setCustomShippingPaymentType('cod');
      // Refresh order to show updated status
      const updatedOrder = await getOrderWithItems(orderId);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('Failed to record shipping payment method:', err);
    }
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
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
            <div className="flex items-start gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
              <h2 className="text-base sm:text-lg font-semibold">Error Loading Order</h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base break-words">{error || 'Order not found'}</p>
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

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-green-700 font-medium text-sm sm:text-base">Order submitted</span>
          </div>
        )}

        {/* Pharmacy Confirmation Required Message */}
        {hasItemsRequiringConfirmation() && (
          <div className="mb-6 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 text-sm sm:text-base mb-2">Pharmacy Review Required</h3>
                <p className="text-amber-800 text-xs sm:text-sm mb-3">
                  Your order contains items that require review and confirmation by our pharmacy team. Our pharmacists will contact you to confirm your order before processing.
                </p>
                <div className="space-y-2">
                  <p className="text-amber-800 text-xs sm:text-sm font-medium">We&apos;ll reach out via:</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>Phone</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm">
                      <MessageCircle className="w-4 h-4 flex-shrink-0" />
                      <span>WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span>Email</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">Order {order.order_number}</h1>
              <p className="text-gray-600 flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
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

          {/* Payment Options - For Payment Pending Orders */}
          {shouldShowPaymentButton() && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bank Transfer Option */}
                <button
                  onClick={() => setShowBankTransferModal(true)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition text-left"
                >
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm md:text-base">
                        Bank Transfer
                      </h5>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        Transfer to our bank account and upload receipt
                      </p>
                    </div>
                  </div>
                </button>

                {/* Card Payment Option - Fygaro */}
                <button
                  onClick={() => setShowFygaroModal(true)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
                >
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="w-full">
                      <h5 className="font-semibold text-gray-900 text-sm md:text-base">
                        Card Payment
                      </h5>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">
                        Pay securely with your credit or debit card
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm">Product</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm">Qty</th>
                  <th className="text-right py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm">Price</th>
                  <th className="text-right py-3 px-3 sm:px-4 font-semibold text-gray-700 text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 sm:px-4 text-gray-900 font-medium text-sm">{item.drug_name}</td>
                    <td className="py-3 px-3 sm:px-4 text-center text-gray-700 text-sm">{item.quantity}</td>
                    <td className="py-3 px-3 sm:px-4 text-right text-gray-700 text-sm">
                      ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right text-gray-900 font-semibold text-sm">
                      ${Number(item.total_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Subtotal</span>
                <span>${Number(order.subtotal_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Tax (10%)</span>
                <span>${Number(order.tax_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base text-gray-700">
                <span>Shipping</span>
                <span>
                  {order.shipping_collect_on_delivery ? (
                    <>To be paid on delivery{order.shipping_estimated_amount ? ` (${Number(order.shipping_estimated_amount).toFixed(2)})` : ''}</>
                  ) : (
                    <>${Number(order.shipping_amount).toFixed(2)}</>
                  )}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg sm:text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Billing */}
          <div className="space-y-3 sm:space-y-4">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <span>Shipping Address</span>
              </h3>
              <p className="text-gray-700 text-xs sm:text-sm break-words">
                {order.shipping_street_line_1 ? (
                  <>
                    {order.shipping_street_line_1}
                    {order.shipping_street_line_2 && <> {order.shipping_street_line_2}</>}
                    <br />
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                    <br />
                    {order.shipping_country}
                  </>
                ) : (
                  'Not provided'
                )}
              </p>
            </div>

            {/* Custom Shipping Payment Options - Only if custom rate is set */}
            {order.shipping_custom_rate && order.shipping_custom_rate > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <span>📍 Custom Delivery Quote</span>
                </h3>
                <p className="text-sm sm:text-base text-orange-800 mb-4">
                  <span className="font-semibold">JMD {order.shipping_custom_rate?.toFixed(2)}</span> - Custom Quote
                </p>
                
                {order.shipping_paid_online ? (
                  <div className="bg-green-100 border border-green-400 rounded px-3 py-2 text-sm text-green-800">
                    ✓ Delivery payment scheduled for online payment
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-800 font-medium mb-3">How would you like to pay for delivery?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCustomShippingPaymentCOD()}
                        className="p-3 border-2 border-orange-300 rounded-lg hover:bg-orange-100 transition text-left"
                      >
                        <p className="font-semibold text-orange-900 text-sm">Pay on Delivery</p>
                        <p className="text-xs text-orange-700 mt-1">Pay {order.shipping_custom_rate?.toFixed(2)} JMD when delivered</p>
                      </button>
                      <button
                        onClick={() => handleCustomShippingPaymentOnline()}
                        className="p-3 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition text-left"
                      >
                        <p className="font-semibold text-blue-900 text-sm">Pay Online Now</p>
                        <p className="text-xs text-blue-700 mt-1">Pay {order.shipping_custom_rate?.toFixed(2)} JMD securely online</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Order Notes</h3>
            <p className="text-gray-700 text-sm sm:text-base break-words">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons - Continue Shopping */}
        {!shouldShowPaymentButton() && (
          <Link
            href="/store"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center whitespace-nowrap"
          >
            Continue Shopping
          </Link>
        )}

        {/* Payment Modals */}
        {order && (
          <>
            <FygaroPaymentModal
              isOpen={showFygaroModal}
              onClose={() => setShowFygaroModal(false)}
              order={order}
              paymentType={customShippingPaymentType === 'online' ? 'custom_shipping' : 'full_order'}
            />

            <BankTransferModal
              isOpen={showBankTransferModal}
              onClose={() => setShowBankTransferModal(false)}
              orderId={order.id}
              orderNumber={order.order_number}
              amount={order.total_amount}
              bankConfig={bankConfig}
              onPaymentInitiated={() => {
                // Optionally handle payment initiated
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

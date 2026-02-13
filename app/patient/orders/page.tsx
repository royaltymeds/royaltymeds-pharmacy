'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Order, OrderWithItems, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/types/orders';
import { ChevronDown, Package, Calendar, DollarSign, FileText, Edit2, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrdersByUser, getOrderWithItems } from '@/app/actions/orders';
import { OrderPaymentSection } from '@/app/patient/components/OrderPaymentSection';
import { UpdateReceiptModal } from '@/app/patient/components/UpdateReceiptModal';
import { getPaymentConfig } from '@/app/actions/payments';
import { PaymentConfig } from '@/lib/types/payments';
import { formatCurrency } from '@/lib/utils/currency';

const ITEMS_PER_PAGE = 10;

export default function PatientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderWithItems>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bankConfig, setBankConfig] = useState<PaymentConfig | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string>('');
  const [updateReceiptModalOpen, setUpdateReceiptModalOpen] = useState(false);
  const [updateReceiptOrderId, setUpdateReceiptOrderId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Filter orders based on search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.total_amount.toString().includes(searchTerm);
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePaymentInitiated = async (orderId: string) => {
    // Refresh order details after payment
    try {
      const details = await getOrderWithItems(orderId);
      setOrderDetails((prev) => ({ ...prev, [orderId]: details }));
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, ...details } : order))
      );
    } catch (err) {
      console.error('Failed to refresh order after payment:', err);
    }
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

        {/* Search and Filter */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by order number or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-600 mt-3">
              Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedOrders.map((order) => {
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
                              {formatCurrency(order.total_amount)}
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
                                    Unit Price: {formatCurrency(item.unit_price)}
                                  </span>
                                  <span>
                                    Subtotal: {formatCurrency(
                                      item.unit_price * item.quantity
                                    )}
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
                            {formatCurrency(
                              order.total_amount -
                              order.tax_amount -
                              order.shipping_amount
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Tax</span>
                          <span>{formatCurrency(order.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Shipping</span>
                          <span>{formatCurrency(order.shipping_amount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      {/* Payment Section */}
                      <OrderPaymentSection
                        order={order}
                        bankConfig={bankConfig}
                        onPaymentInitiated={() => handlePaymentInitiated(order.id)}
                      />

                      {/* Receipts Section */}
                      {order.receipt_url && (
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText size={20} />
                            Receipt Uploaded
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Action Buttons - Left side */}
                            <div className="md:col-span-2 space-y-3">
                              <button 
                                onClick={() => {
                                  setUpdateReceiptOrderId(order.id);
                                  setUpdateReceiptModalOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                              >
                                <Edit2 size={16} />
                                Update Receipt
                              </button>
                              {/* View Receipt Button */}
                              <button
                                onClick={() => {
                                  setReceiptModalUrl(order.receipt_url || '');
                                  setReceiptModalOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                              >
                                <FileText size={16} />
                                View Receipt
                              </button>
                            </div>
                            {/* Receipt Thumbnail - Right side */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-24 md:h-32">
                              {order.receipt_url.includes('.pdf') ? (
                                <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                                  <FileText className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                                </div>
                              ) : (
                                <Image
                                  src={order.receipt_url}
                                  alt="Payment receipt"
                                  width={150}
                                  height={128}
                                  className="w-full h-full object-contain"
                                  unoptimized
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Addresses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Shipping Address
                          </h5>
                          <p className="text-sm text-gray-600">
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
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">
                            Billing Address
                          </h5>
                          <p className="text-sm text-gray-600">
                            {order.billing_street_line_1 ? (
                              <>
                                {order.billing_street_line_1}
                                {order.billing_street_line_2 && <> {order.billing_street_line_2}</>}
                                <br />
                                {order.billing_city}, {order.billing_state} {order.billing_postal_code}
                                <br />
                                {order.billing_country}
                              </>
                            ) : (
                              'Not provided'
                            )}
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
        ) : searchTerm ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No orders found matching your search</p>
            <button
              onClick={() => setSearchTerm('')}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
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

        {/* Update Receipt Modal */}
        {updateReceiptOrderId && (
          <UpdateReceiptModal
            isOpen={updateReceiptModalOpen}
            onClose={() => {
              setUpdateReceiptModalOpen(false);
              setUpdateReceiptOrderId('');
            }}
            orderId={updateReceiptOrderId}
            currentReceiptUrl={orders.find(o => o.id === updateReceiptOrderId)?.receipt_url || ''}
            onReceiptUpdated={async () => {
              // Refresh order details after receipt update
              try {
                const details = await getOrderWithItems(updateReceiptOrderId);
                setOrderDetails((prev) => ({ ...prev, [updateReceiptOrderId]: details }));
                setOrders((prevOrders) =>
                  prevOrders.map((order) => 
                    order.id === updateReceiptOrderId ? { ...order, ...details } : order
                  )
                );
              } catch (err) {
                console.error('Failed to refresh order after receipt update:', err);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

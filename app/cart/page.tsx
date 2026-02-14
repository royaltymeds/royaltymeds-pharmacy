'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/currency';
import { CartItem } from '@/lib/types/orders';
import { OTCDrug } from '@/lib/types/inventory';
import { PaymentConfig } from '@/lib/types/payments';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';
import { Trash2, Plus, Minus, ArrowLeft, AlertCircle } from 'lucide-react';
import { getCart, removeFromCart, updateCartItem, createOrder } from '@/app/actions/orders';
import { getOTCDrugById } from '@/app/actions/inventory';
import { getPaymentConfig } from '@/app/actions/payments';
import { useCart } from '@/lib/context/CartContext';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [drugDetails, setDrugDetails] = useState<Record<string, OTCDrug>>({});
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [checkoutForm, setCheckoutForm] = useState(false);
  const [formData, setFormData] = useState({
    shipping_street_line_1: '',
    shipping_street_line_2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: 'Jamaica',
    billing_street_line_1: '',
    billing_street_line_2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    billing_country: 'Jamaica',
    notes: '',
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  const { clearCart } = useCart();

  // Load cart and drug details
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const items = await getCart();
        setCartItems(items);

        // Fetch drug details for all items
        const details: Record<string, OTCDrug> = {};
        for (const item of items) {
          const drug = await getOTCDrugById(item.drug_id);
          if (drug) {
            details[item.drug_id] = drug;
          }
        }
        setDrugDetails(details);

        // Fetch payment config for tax and shipping settings
        const config = await getPaymentConfig();
        setPaymentConfig(config);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(itemId);
    try {
      await updateCartItem(itemId, newQuantity);
      setCartItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      await removeFromCart(itemId);
      setCartItems((items) => items.filter((item) => item.id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const drug = drugDetails[item.drug_id];
    if (!drug) return sum;
    
    // Calculate the price to use (sale price or regular price)
    let itemPrice = drug.unit_price;
    if (drug.is_on_sale) {
      if (drug.sale_price && drug.sale_price > 0) {
        itemPrice = drug.sale_price;
      } else if (drug.sale_discount_percent && drug.sale_discount_percent > 0) {
        itemPrice = drug.unit_price * (1 - drug.sale_discount_percent / 100);
      }
    }
    
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Tax handling: if tax_type is 'inclusive', don't add extra tax (it's already in the price)
  const tax = paymentConfig && paymentConfig.tax_type === 'inclusive' ? 0 : 0;
  
  // Shipping: use Kingston delivery cost from config if available, otherwise 0
  const shipping = cartItems.length > 0 && paymentConfig ? paymentConfig.kingston_delivery_cost : 0;
  
  const total = subtotal + tax + shipping;

  // Handle checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingOrder(true);
    setError('');

    try {
      // Validate shipping address
      if (!formData.shipping_street_line_1.trim()) {
        throw new Error('Shipping street address is required');
      }
      if (!formData.shipping_city.trim()) {
        throw new Error('Shipping city is required');
      }
      if (!formData.shipping_state.trim()) {
        throw new Error('Shipping province/state is required');
      }

      // Validate billing address
      if (!formData.billing_street_line_1.trim()) {
        throw new Error('Billing street address is required');
      }
      if (!formData.billing_city.trim()) {
        throw new Error('Billing city is required');
      }
      if (!formData.billing_state.trim()) {
        throw new Error('Billing province/state is required');
      }

      const order = await createOrder(
        {
          streetLine1: formData.shipping_street_line_1,
          streetLine2: formData.shipping_street_line_2 || undefined,
          city: formData.shipping_city,
          state: formData.shipping_state,
          postalCode: formData.shipping_postal_code,
          country: formData.shipping_country,
        },
        {
          streetLine1: formData.billing_street_line_1,
          streetLine2: formData.billing_street_line_2 || undefined,
          city: formData.billing_city,
          state: formData.billing_state,
          postalCode: formData.billing_postal_code,
          country: formData.billing_country,
        },
        formData.notes || undefined
      );

      // Clear cart after successful order
      clearCart();

      // Redirect to order confirmation or success page
      window.location.href = `/patient/orders/${order.id}?success=true`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Store
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const drug = drugDetails[item.drug_id];
                if (!drug) return null;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md p-4 flex gap-4"
                  >
                    {/* Product Image */}
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                      <Image
                        src={drug.file_url || DEFAULT_INVENTORY_IMAGE}
                        alt={drug.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-900">{drug.name}</h3>
                      <p className="text-sm text-gray-600">{drug.category}</p>
                      <div className="mt-2">
                        {(() => {
                          // Calculate the price to use (sale price or regular price)
                          let itemPrice = drug.unit_price;
                          if (drug.is_on_sale) {
                            if (drug.sale_price && drug.sale_price > 0) {
                              itemPrice = drug.sale_price;
                            } else if (drug.sale_discount_percent && drug.sale_discount_percent > 0) {
                              itemPrice = drug.unit_price * (1 - drug.sale_discount_percent / 100);
                            }
                          }
                          return (
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(itemPrice)} each
                              </p>
                              {drug.is_on_sale && itemPrice < drug.unit_price && (
                                <span className="text-sm line-through text-gray-500">
                                  {formatCurrency(drug.unit_price)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Quantity and Remove */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updating === item.id}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400"
                      >
                        <Trash2 size={20} />
                      </button>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={updating === item.id || item.quantity === 1}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                          className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      {/* Item Total */}
                      <p className="text-lg font-bold text-gray-900">
                        {(() => {
                          // Calculate the price to use (sale price or regular price)
                          let itemPrice = drug.unit_price;
                          if (drug.is_on_sale) {
                            if (drug.sale_price && drug.sale_price > 0) {
                              itemPrice = drug.sale_price;
                            } else if (drug.sale_discount_percent && drug.sale_discount_percent > 0) {
                              itemPrice = drug.unit_price * (1 - drug.sale_discount_percent / 100);
                            }
                          }
                          return formatCurrency(itemPrice * item.quantity);
                        })()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">Your cart is empty</p>
                <Link
                  href="/store"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </div>

          {/* Order Summary and Checkout */}
          {cartItems.length > 0 && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                <div className="space-y-3 border-b border-gray-200 pb-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {paymentConfig && paymentConfig.tax_type === 'inclusive' && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>({paymentConfig.tax_rate}% GCT Inclusive)</span>
                      <span></span>
                    </div>
                  )}
                  {shipping > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery (Kingston)</span>
                      <span>{formatCurrency(shipping)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout Form */}
              {!checkoutForm ? (
                <button
                  onClick={() => setCheckoutForm(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Shipping & Billing</h2>
                  <form onSubmit={handleCheckout} className="space-y-6">
                    {/* Shipping Address */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Shipping Address</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={formData.shipping_street_line_1}
                            onChange={(e) =>
                              setFormData({ ...formData, shipping_street_line_1: e.target.value })
                            }
                            placeholder="123 Main Street"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address (Continued)
                          </label>
                          <input
                            type="text"
                            value={formData.shipping_street_line_2}
                            onChange={(e) =>
                              setFormData({ ...formData, shipping_street_line_2: e.target.value })
                            }
                            placeholder="Apartment, suite, etc. (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={formData.shipping_city}
                              onChange={(e) =>
                                setFormData({ ...formData, shipping_city: e.target.value })
                              }
                              placeholder="Kingston"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Province/State *
                            </label>
                            <input
                              type="text"
                              value={formData.shipping_state}
                              onChange={(e) =>
                                setFormData({ ...formData, shipping_state: e.target.value })
                              }
                              placeholder="Kingston"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={formData.shipping_postal_code}
                              onChange={(e) =>
                                setFormData({ ...formData, shipping_postal_code: e.target.value })
                              }
                              placeholder="12345 (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country *
                            </label>
                            <select
                              value={formData.shipping_country}
                              onChange={(e) =>
                                setFormData({ ...formData, shipping_country: e.target.value })
                              }
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Jamaica">Jamaica</option>
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Billing Address</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={formData.billing_street_line_1}
                            onChange={(e) =>
                              setFormData({ ...formData, billing_street_line_1: e.target.value })
                            }
                            placeholder="123 Main Street"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address (Continued)
                          </label>
                          <input
                            type="text"
                            value={formData.billing_street_line_2}
                            onChange={(e) =>
                              setFormData({ ...formData, billing_street_line_2: e.target.value })
                            }
                            placeholder="Apartment, suite, etc. (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={formData.billing_city}
                              onChange={(e) =>
                                setFormData({ ...formData, billing_city: e.target.value })
                              }
                              placeholder="Kingston"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Province/State *
                            </label>
                            <input
                              type="text"
                              value={formData.billing_state}
                              onChange={(e) =>
                                setFormData({ ...formData, billing_state: e.target.value })
                              }
                              placeholder="Kingston"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={formData.billing_postal_code}
                              onChange={(e) =>
                                setFormData({ ...formData, billing_postal_code: e.target.value })
                              }
                              placeholder="12345 (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country *
                            </label>
                            <select
                              value={formData.billing_country}
                              onChange={(e) =>
                                setFormData({ ...formData, billing_country: e.target.value })
                              }
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Jamaica">Jamaica</option>
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Any special instructions..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={processingOrder}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                      >
                        {processingOrder ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { getPaymentConfig, getShippingRateByLocation } from '@/app/actions/payments';
import { useCart } from '@/lib/context/CartContext';

const JAMAICAN_PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Thomas',
  'Portland',
  'St. Mary',
  'St. Ann',
  'Trelawny',
  'St. James',
  'Hanover',
  'Westmoreland',
  'St. Elizabeth',
  'Manchester',
  'Clarendon',
  'St. Catherine',
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [drugDetails, setDrugDetails] = useState<Record<string, OTCDrug>>({});
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shipping_street_line_1: '',
    shipping_street_line_2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: 'Jamaica',
    notes: '',
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  const [useProfileAddress, setUseProfileAddress] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({});
  const [shipping, setShipping] = useState<number>(0);
  const [payOnDelivery, setPayOnDelivery] = useState<boolean>(false);
  const quantityTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const { clearCart } = useCart();

  // Load cart, drug details, and user profile
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

    const loadUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/get-profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile) {
            setUserProfile(profile);
            // Prefill shipping address from profile if it has address data
            if (profile.street_address_line_1 || profile.city || profile.state) {
              setFormData(prev => ({
                ...prev,
                shipping_street_line_1: profile.street_address_line_1 || '',
                shipping_street_line_2: profile.street_address_line_2 || '',
                shipping_city: profile.city || '',
                shipping_state: profile.state || '',
                shipping_postal_code: profile.postal_code || '',
              }));
            }
            setUseProfileAddress(false);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };

    loadCart();
    loadUserProfile();
  }, []);

  // Calculate shipping rate based on parish and city/town
  useEffect(() => {
    const calculateShipping = async () => {
      if (formData.shipping_state) {
        try {
          const rate = await getShippingRateByLocation(
            formData.shipping_state,
            formData.shipping_city || undefined
          );
          setShipping(rate);
        } catch (err) {
          console.error('Failed to calculate shipping rate:', err);
          setShipping(0);
        }
      } else {
        setShipping(0);
      }
    };

    calculateShipping();
  }, [formData.shipping_state, formData.shipping_city]);

  // Handle quantity input change with debounce
  const handleQuantityInputChange = (itemId: string, newQuantity: number) => {
    // Update pending quantities for display
    setPendingQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));

    // Clear existing timeout for this item
    if (quantityTimeoutsRef.current[itemId]) {
      clearTimeout(quantityTimeoutsRef.current[itemId]);
    }

    // Set new timeout to update after 800ms of inactivity
    quantityTimeoutsRef.current[itemId] = setTimeout(() => {
      if (newQuantity >= 1) {
        handleQuantityChange(itemId, newQuantity);
      }
      delete quantityTimeoutsRef.current[itemId];
    }, 800);
  };

  // Finalize quantity input
  const finalizeQuantityInput = (itemId: string) => {
    if (quantityTimeoutsRef.current[itemId]) {
      clearTimeout(quantityTimeoutsRef.current[itemId]);
      delete quantityTimeoutsRef.current[itemId];
    }
    const qty = pendingQuantities[itemId];
    if (qty && qty >= 1) {
      handleQuantityChange(itemId, qty);
    }
    setPendingQuantities(prev => {
      const newPending = { ...prev };
      delete newPending[itemId];
      return newPending;
    });
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(quantityTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
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
  
  // Shipping is now calculated dynamically based on parish and city in the effect above
  const total = subtotal + tax + (payOnDelivery ? 0 : shipping);

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
        throw new Error('Shipping parish is required');
      }

      const order = await createOrder(
        {
          streetLine1: formData.shipping_street_line_1,
          streetLine2: formData.shipping_street_line_2 || undefined,
          city: formData.shipping_city,
          state: formData.shipping_state,
          postalCode: formData.shipping_postal_code,
          country: 'Jamaica',
        },
        undefined,
        formData.notes || undefined,
        payOnDelivery
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
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-auto lg:overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Store
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>
      </div>

      {/* Main Content - Two Independent Sections */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        {/* Error Message - inside flex container */}
        {error && (
          <div className="absolute top-20 left-4 right-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 z-40">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {/* Left Section - Cart Items */}
        <div className="w-full lg:w-1/2 lg:flex-1 bg-white lg:bg-gradient-to-br lg:from-blue-50 lg:to-indigo-100 p-4 lg:p-0 lg:overflow-y-auto lg:hide-scrollbar">
          <div className="space-y-4 lg:space-y-0">

            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const drug = drugDetails[item.drug_id];
                if (!drug) return null;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg lg:rounded-none shadow-md lg:shadow-none p-4 md:p-4 lg:p-4 flex gap-4 lg:border-b lg:border-gray-200 lg:last:border-b-0"
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
                        <input
                          type="number"
                          value={pendingQuantities[item.id] ?? item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            handleQuantityInputChange(item.id, Math.max(1, qty));
                          }}
                          onBlur={() => finalizeQuantityInput(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                              finalizeQuantityInput(item.id);
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          min="1"
                          disabled={updating === item.id}
                          className="w-12 text-center font-semibold border border-gray-300 rounded px-2 py-1"
                        />
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

        </div>
        
        {/* Right Section - Order Summary and Checkout */}
        {cartItems.length > 0 && (
          <div className="w-full lg:w-1/2 lg:flex-1 bg-white lg:border-l border-gray-200 lg:overflow-y-auto lg:hide-scrollbar flex flex-col">
            <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 w-full">
              {/* Checkout Form - Always Visible */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Shipping Address</h2>
                <p className="text-sm text-gray-600 mb-4">Enter your shipping address (required). Your shipping cost is calculated based on your location and will update as you fill in your details.</p>
                <form onSubmit={handleCheckout} className="space-y-6">
                  {/* Use Profile Address Checkbox - show if profile exists and has address data */}
                  {userProfile && (userProfile.street_address_line_1 || userProfile.city || userProfile.state) && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="useProfileAddress"
                        checked={useProfileAddress}
                        onChange={(e) => {
                          setUseProfileAddress(e.target.checked);
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              shipping_street_line_1: userProfile.street_address_line_1 || '',
                              shipping_street_line_2: userProfile.street_address_line_2 || '',
                              shipping_city: userProfile.city || '',
                              shipping_state: userProfile.state || '',
                              shipping_postal_code: userProfile.postal_code || '',
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              shipping_street_line_1: '',
                              shipping_street_line_2: '',
                              shipping_city: '',
                              shipping_state: '',
                              shipping_postal_code: '',
                            }));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="useProfileAddress" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Use my profile address as shipping address
                      </label>
                    </div>
                  )}

                  {/* Cash on Delivery Option */}
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="payOnDelivery"
                      checked={payOnDelivery}
                      onChange={(e) => setPayOnDelivery(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <label htmlFor="payOnDelivery" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Pay shipping on delivery (Cash on Delivery)
                    </label>
                  </div>

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
                          disabled={useProfileAddress}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
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
                          disabled={useProfileAddress}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
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
                            disabled={useProfileAddress}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parish *
                          </label>
                          <select
                            value={formData.shipping_state}
                            onChange={(e) =>
                              setFormData({ ...formData, shipping_state: e.target.value })
                            }
                            required
                            disabled={useProfileAddress}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                          >
                            <option value="">Select Parish</option>
                            {JAMAICAN_PARISHES.map((parish) => (
                              <option key={parish} value={parish}>
                                {parish}
                              </option>
                            ))}
                          </select>
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
                            disabled={useProfileAddress}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country *
                          </label>
                          <input
                            type="text"
                            value="Jamaica"
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
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

                  {/* Order Summary - Inside Form (Place Order button here) */}
                  <div className="bg-white rounded-lg shadow-md p-4 md:p-4 lg:p-6 space-y-4">
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
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping/Delivery</span>
                        <span>
                          {payOnDelivery ? (
                            <>To be paid on delivery ({formatCurrency(shipping)})</>
                          ) : (
                            <>{formatCurrency(shipping)}</>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>

                    {/* Shipping Advisory */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-xs md:text-sm text-gray-700">
                        <span className="font-semibold text-blue-900">💡 Shipping Notice:</span> Your shipping/delivery cost is calculated based on your selected shipping address. {formData.shipping_state && formData.shipping_city ? 'Current: ' + formData.shipping_city + ', ' + formData.shipping_state : 'Enter your shipping address to see the correct shipping cost.'}
                      </p>
                    </div>

                    {/* Place Order Button (fits text) */}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={processingOrder}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {processingOrder ? 'Processing...' : 'Place Order'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Loader, ExternalLink } from 'lucide-react';
import { Order } from '@/lib/types/orders';

interface FygaroPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  paymentType?: 'full_order' | 'custom_shipping';
}

export function FygaroPaymentModal({
  isOpen,
  onClose,
  order,
  paymentType = 'full_order',
}: FygaroPaymentModalProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the amount to pay based on payment type
  const paymentAmount = paymentType === 'custom_shipping' ? order.shipping_custom_rate : order.total_amount;
  const isCustomShipping = paymentType === 'custom_shipping';

  useEffect(() => {
    if (!isOpen) {
      setPaymentUrl(null);
      setLoading(true);
      setError(null);
      return;
    }

    const generatePaymentUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/payments/create-payment', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: paymentAmount,
            orderId: order.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate payment link');
        }

        const { url } = await response.json();
        setPaymentUrl(url);
      } catch (err) {
        console.error('Payment URL generation failed:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load payment portal'
        );
      } finally {
        setLoading(false);
      }
    };

    generatePaymentUrl();
  }, [isOpen, paymentAmount, order.id]);

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {isCustomShipping ? 'Pay Delivery' : 'Card Payment'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close payment portal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600 font-medium text-center">
                Preparing secure payment portal...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Unable to Load Payment
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className={`border rounded-lg p-4 ${isCustomShipping ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`text-sm ${isCustomShipping ? 'text-orange-800' : 'text-blue-800'}`}>
                  <strong>{isCustomShipping ? 'Delivery Cost:' : 'Order Total:'}</strong> JMD {parseFloat(paymentAmount?.toString() || '0').toFixed(2)}
                </p>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Click the button below to proceed to the secure Fygaro payment portal.
                </p>
                <p>
                  Your payment details will be processed securely.
                </p>
              </div>

              <button
                onClick={handleOpenPayment}
                disabled={!paymentUrl}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Proceed to Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

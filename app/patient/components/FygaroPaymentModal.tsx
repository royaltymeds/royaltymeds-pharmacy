'use client';

import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { Order } from '@/lib/types/orders';

interface FygaroPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export function FygaroPaymentModal({
  isOpen,
  onClose,
  order,
}: FygaroPaymentModalProps) {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            amount: order.total_amount,
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
  }, [isOpen, order.total_amount, order.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Secure Payment
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

        {/* Content - iframe or loading/error state */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-600 font-medium">
                  Loading payment portal...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10 p-4">
              <div className="text-center max-w-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Unable to Load Payment Portal
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={onClose}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {paymentUrl && !loading && (
            <iframe
              src={paymentUrl}
              className="w-full h-full border-0"
              title="Fygaro Payment Portal"
              allow="payment"
            />
          )}
        </div>
      </div>
    </div>
  );
}

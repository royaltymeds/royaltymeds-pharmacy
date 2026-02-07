'use client';

import { useState } from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import { Order } from '@/lib/types/orders';
import { PaymentConfig } from '@/lib/types/payments';
import { BankTransferModal } from './BankTransferModal';

interface OrderPaymentSectionProps {
  order: Order;
  bankConfig: PaymentConfig | null;
  onPaymentInitiated?: () => void;
}

export function OrderPaymentSection({
  order,
  bankConfig,
  onPaymentInitiated,
}: OrderPaymentSectionProps) {
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);

  // Only show payment options when order is confirmed and not yet paid
  if (order.status !== 'confirmed' || order.payment_status === 'paid') {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 md:p-6 border-t-4 border-green-600">
        <h4 className="font-semibold text-gray-900 mb-4 text-sm md:text-base">
          Payment Options
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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

          {/* Card Payment Option - Fygaro Button */}
          <a
            href="https://www.fygaro.com/en/pb/e3df4b61-668c-43e3-9b02-623ac3f534ef/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left block"
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
          </a>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      <BankTransferModal
        isOpen={showBankTransferModal}
        onClose={() => setShowBankTransferModal(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        amount={order.total_amount}
        bankConfig={bankConfig}
        onPaymentInitiated={() => {
          onPaymentInitiated?.();
        }}
      />
    </>
  );
}

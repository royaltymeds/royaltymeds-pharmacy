// Types for payment configuration
export interface PaymentConfig {
  id: string;
  bank_account_holder: string;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  iban?: string;
  swift_code?: string;
  additional_instructions?: string;
  // Tax configuration
  tax_type: 'none' | 'inclusive';
  tax_rate: number;
  // Shipping/Delivery configuration
  kingston_delivery_cost: number;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'bank_transfer' | 'card';

export const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  card: 'Card Payment (via Fygaro)',
};

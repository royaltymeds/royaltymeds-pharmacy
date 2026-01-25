// Types for ecommerce/orders
export interface Order {
  id: string;
  user_id: string;
  customer_name?: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'payment_pending' | 'payment_verified' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal_amount: number;
  tax_amount: number;
  shipping_amount: number;
  shipping_address?: string;
  billing_address?: string;
  notes?: string;
  payment_status?: 'unpaid' | 'pending' | 'paid' | 'failed';
  payment_method?: 'bank_transfer' | 'card' | null;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  drug_id: string;
  drug_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  drug_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export type OrderStatus = 'pending' | 'confirmed' | 'payment_pending' | 'payment_verified' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'payment_pending',
  'payment_verified',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  payment_pending: 'Payment Pending',
  payment_verified: 'Payment Verified',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FBBF24',
  confirmed: '#3B82F6',
  payment_pending: '#EC4899',
  payment_verified: '#8B5CF6',
  processing: '#A855F7',
  shipped: '#6366F1',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

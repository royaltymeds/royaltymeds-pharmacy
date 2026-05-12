// Restock Management Types

export type ReorderScheduleCadence = 'daily' | 'weekly' | 'bi_weekly' | 'three_weeks' | 'monthly' | 'custom';
export type RestockRequestStatus = 'requested' | 'linked_to_po' | 'received' | 'cancelled';
export type PurchaseOrderStatus = 'open' | 'placed' | 'received' | 'cancelled';

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  payment_terms?: string;
  lead_time_days: number;
  minimum_order_amount: number;
  reorder_schedule_type?: ReorderScheduleCadence;
  reorder_schedule_start_date?: string;
  reorder_schedule_custom_dates?: string[];
  reorder_schedule_is_recurring?: boolean;
  reorder_schedule_notes?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestockFrequency {
  id: string;
  name: string;
  description?: string;
  days_interval: number;
  is_active: boolean;
  created_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name?: string;
  is_inventory_item?: boolean;
  supplier_sku?: string;
  supplier_unit_price: number;
  minimum_order_quantity: number;
  reorder_frequency_id?: string;
  last_ordered_at?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  frequency?: RestockFrequency;
}

export interface RestockItem {
  id: string;
  restock_request_id: string;
  purchase_order_item_id?: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_requested: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RestockRequest {
  id: string;
  request_number: string;
  supplier_id: string;
  pharmacist_id: string;
  purchase_order_id?: string;
  status: RestockRequestStatus;
  total_amount?: number;
  requested_at: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: RestockItem[];
  purchase_order?: PurchaseOrder;
  pharmacist?: {
    email: string;
    full_name?: string;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  restock_request_id?: string;
  restock_item_id?: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  restock_request?: RestockRequest;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  created_by: string;
  status: PurchaseOrderStatus;
  reorder_date: string;
  is_custom_reorder_date: boolean;
  total_amount: number;
  notes?: string;
  expected_delivery_date?: string;
  placed_at?: string;
  received_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface UpcomingReorder {
  supplier: Supplier;
  next_reorder_date: string | null;
  schedule_label: string;
}

export interface RestockHistory {
  id: string;
  restock_request_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  changed_by: string;
  notes?: string;
  created_at: string;
}

export interface RestockNotificationSettings {
  id: string;
  user_id: string;
  notification_email?: string;
  whatsapp_notifications_enabled?: boolean;
  sms_notifications_enabled?: boolean;
  app_toast_notifications_enabled?: boolean;
  push_notifications_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateRestockNotificationSettingsInput {
  notification_email: string;
  whatsapp_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  app_toast_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
}

export interface CreateRestockRequestInput {
  supplier_id: string;
  items: {
    product_id: string;
    product_type: 'otc' | 'prescription';
    product_name: string;
    quantity_requested: number;
    unit_price: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface CreateSupplierInput {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  payment_terms?: string;
  lead_time_days?: number;
  minimum_order_amount?: number;
  reorder_schedule_type?: ReorderScheduleCadence | '';
  reorder_schedule_start_date?: string;
  reorder_schedule_custom_dates?: string[];
  reorder_schedule_is_recurring?: boolean;
  reorder_schedule_notes?: string;
  notes?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  is_active?: boolean;
}

export interface CreateSupplierProductInput {
  supplier_id: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name?: string;
  is_inventory_item?: boolean;
  supplier_sku?: string;
  supplier_unit_price: number;
  minimum_order_quantity?: number;
  reorder_frequency_id?: string;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  supplier_id: string;
  reorder_date: string;
  is_custom_reorder_date?: boolean;
  notes?: string;
}

export interface UpdatePurchaseOrderItemInput {
  itemId?: string;
  restock_request_id?: string;
  restock_item_id?: string;
  product_id: string;
  product_type: 'otc' | 'prescription';
  product_name: string;
  quantity_ordered: number;
  unit_price: number;
  notes?: string;
}

export interface UpdatePurchaseOrderInput {
  items: UpdatePurchaseOrderItemInput[];
  notes?: string;
}

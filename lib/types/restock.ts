// Restock Management Types

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
  // Joined data
  supplier?: Supplier;
  frequency?: RestockFrequency;
}

export interface RestockItem {
  id: string;
  restock_request_id: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'received' | 'cancelled';
  total_amount?: number;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  rejection_reason?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier?: Supplier;
  items?: RestockItem[];
  pharmacist?: {
    email: string;
    full_name?: string;
  };
  approver?: {
    email: string;
    full_name?: string;
  };
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

// Form DTOs
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
  expected_delivery_date?: string;
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

'use server';

import { Order, OrderItem, CartItem, OrderWithItems } from '@/lib/types/orders';
import { StructuredAddress } from '@/lib/types/address';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getShippingRateByLocation } from './payments';

// Create an admin client that bypasses RLS using service role key
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Create a user client for auth-dependent operations
const getUserClient = async () => {
  return await createServerSupabaseClient();
};

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}${random}`;
}

// ============ CART OPERATIONS ============

export async function getCart(): Promise<CartItem[]> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return data as CartItem[];
}

export async function addToCart(drugId: string, quantity: number): Promise<CartItem> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');
  if (quantity <= 0) throw new Error('Quantity must be greater than 0');

  // Check if item already in cart
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('drug_id', drugId)
    .single();

  if (existingItem) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({
        quantity: existingItem.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CartItem;
  }

  // Add new item
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: user.id,
      drug_id: drugId,
      quantity,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/cart');
  return data as CartItem;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartItem> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');
  if (quantity <= 0) throw new Error('Quantity must be greater than 0');

  const { data, error } = await supabase
    .from('cart_items')
    .update({
      quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/cart');
  return data as CartItem;
}

export async function removeFromCart(itemId: string): Promise<void> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/cart');
}

export async function clearCart(): Promise<void> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/cart');
}

// ============ ORDER OPERATIONS ============

export async function createOrder(
  shippingAddress: StructuredAddress,
  billingAddress?: StructuredAddress,
  notes?: string,
  collectOnDelivery: boolean = false
): Promise<OrderWithItems> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get cart items
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('*, otc_drugs(*)')
    .eq('user_id', user.id);

  if (cartError || !cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // Fetch payment config for tax and shipping settings
  const adminClient = getAdminClient();
  const { data: paymentConfig } = await adminClient
    .from('payment_config')
    .select('*')
    .single();

  // Calculate totals
  let subtotal = 0;
  const orderItems: Array<{
    drug_id: string;
    drug_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    pharm_confirm?: boolean;
  }> = [];

  for (const item of cartItems) {
    const drug = item.otc_drugs as any;
    const totalPrice = drug.unit_price * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      drug_id: item.drug_id,
      drug_name: drug.name,
      quantity: item.quantity,
      unit_price: drug.unit_price,
      total_price: totalPrice,
      pharm_confirm: drug.pharm_confirm || false,
    });
  }

  // Use payment config for tax and shipping calculations
  // Tax: if inclusive, don't add extra tax (already in price); otherwise 0
  const tax = paymentConfig && paymentConfig.tax_type === 'inclusive' ? 0 : 0;
  
  // Shipping: look up rate based on parish and city/town from the address
  const shipping = await getShippingRateByLocation(
    shippingAddress.state,
    shippingAddress.city
  );

  // If customer chose to pay on delivery (COD), do NOT include shipping in the stored total
  const shippingAmountForTotal = collectOnDelivery ? 0 : shipping;
  const total = subtotal + tax + shippingAmountForTotal;

  // Check if any items require pharmacist confirmation
  const hasItemsRequiringConfirmation = orderItems.some((item) => item.pharm_confirm === true);
  
  // Set order status: if items need confirmation, pending; otherwise payment_pending
  const orderStatus = hasItemsRequiringConfirmation ? 'pending' : 'payment_pending';

  // Create order
  const orderNumber = generateOrderNumber();
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: orderStatus,
      subtotal_amount: subtotal,
      tax_amount: tax,
      shipping_amount: collectOnDelivery ? 0 : shipping,
      shipping_collect_on_delivery: collectOnDelivery,
      shipping_estimated_amount: collectOnDelivery ? shipping : null,
      total_amount: total,
      shipping_street_line_1: shippingAddress.streetLine1,
      shipping_street_line_2: shippingAddress.streetLine2 || null,
      shipping_city: shippingAddress.city,
      shipping_state: shippingAddress.state,
      shipping_postal_code: shippingAddress.postalCode,
      shipping_country: shippingAddress.country,
      billing_street_line_1: billingAddress?.streetLine1 || null,
      billing_street_line_2: billingAddress?.streetLine2 || null,
      billing_city: billingAddress?.city || null,
      billing_state: billingAddress?.state || null,
      billing_postal_code: billingAddress?.postalCode || null,
      billing_country: billingAddress?.country || null,
      notes,
    })
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  // Create order items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      orderItems.map((item) => ({
        order_id: orderData.id,
        ...item,
      }))
    );

  if (itemsError) throw new Error(itemsError.message);

  // Clear cart
  await clearCart();

  revalidatePath('/patient/orders');
  revalidatePath('/admin/orders');

  return {
    ...(orderData as Order),
    items: orderItems.map((item, idx) => ({
      id: `temp-${idx}`,
      order_id: orderData.id,
      ...item,
      created_at: new Date().toISOString(),
    } as OrderItem)),
  };
}

export async function getOrdersByUser(): Promise<Order[]> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, total_amount, subtotal_amount, tax_amount, shipping_amount, shipping_collect_on_delivery, shipping_estimated_amount, shipping_custom_rate, shipping_paid_online, shipping_custom_rate_collect_on_delivery, payment_status, payment_method, receipt_url, transaction_id, is_prescription_order, prescription_id, doctor_prescription_id, shipping_street_line_1, shipping_street_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_street_line_1, billing_street_line_2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Order[];
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems> {
  const supabase = await getUserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, total_amount, subtotal_amount, tax_amount, shipping_amount, shipping_collect_on_delivery, shipping_estimated_amount, shipping_custom_rate, shipping_paid_online, shipping_custom_rate_collect_on_delivery, payment_status, payment_method, receipt_url, transaction_id, is_prescription_order, prescription_id, doctor_prescription_id, shipping_street_line_1, shipping_street_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_street_line_1, billing_street_line_2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at')
    .eq('id', orderId)
    .single();

  if (orderError) throw new Error(orderError.message);

  // Verify ownership
  if (order.user_id !== user.id) {
    throw new Error('Unauthorized');
  }

  // Get order items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  return {
    ...(order as Order),
    items: items as OrderItem[],
  };
}

// ============ ADMIN OPERATIONS ============

export async function getAllOrders(): Promise<Order[]> {
  const supabase = getAdminClient();

  // Step 1: Fetch all orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, total_amount, subtotal_amount, tax_amount, shipping_amount, shipping_collect_on_delivery, shipping_estimated_amount, shipping_custom_rate, shipping_paid_online, shipping_custom_rate_collect_on_delivery, payment_status, payment_method, receipt_url, transaction_id, is_prescription_order, prescription_id, doctor_prescription_id, shipping_street_line_1, shipping_street_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_street_line_1, billing_street_line_2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (ordersError) throw new Error(ordersError.message);
  if (!orders || orders.length === 0) return [];

  // Step 2: Extract order IDs and user IDs
  const orderIds = (orders as any[]).map(o => o.id);
  const userIds = [...new Set((orders as any[]).map(o => o.user_id))];

  // Step 3: Query user_profiles for customer names
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', userIds);

  if (profilesError) throw new Error(profilesError.message);

  // Step 4: Query order_items to check which orders need pharmacist confirmation
  const { data: itemsNeedingConfirmation, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds)
    .eq('pharm_confirm', true);

  if (itemsError) throw new Error(itemsError.message);

  // Step 5: Create maps for efficient lookup
  const profileMap = new Map(
    (profiles as any[]).map(p => [p.user_id, p.full_name])
  );
  const ordersNeedingConfirmationSet = new Set(
    (itemsNeedingConfirmation as any[]).map(item => item.order_id)
  );

  // Step 6: Attach customer_name and confirmation status to each order
  return (orders as any[]).map(order => ({
    ...order,
    customer_name: profileMap.get(order.user_id) || 'Unknown Customer',
    needs_confirmation: ordersNeedingConfirmationSet.has(order.id)
  })) as Order[];
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'payment_pending' | 'payment_verified' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
): Promise<Order> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
  return data as Order;
}

// Check if there's enough inventory for an order
export async function checkInventoryAvailability(orderId: string): Promise<{ isAvailable: boolean; missingItems: Array<{ drug_name: string; required: number; available: number }> }> {
  const supabase = getAdminClient();

  // Get order items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  if (!orderItems || orderItems.length === 0) {
    return { isAvailable: true, missingItems: [] };
  }

  const missingItems = [];

  // Check each item's inventory
  for (const item of orderItems) {
    const { data: drug, error: drugError } = await supabase
      .from('otc_drugs')
      .select('quantity_on_hand')
      .eq('id', item.drug_id)
      .single();

    if (drugError) continue;

    if (!drug || drug.quantity_on_hand < item.quantity) {
      missingItems.push({
        drug_name: item.drug_name,
        required: item.quantity,
        available: drug?.quantity_on_hand || 0,
      });
    }
  }

  return {
    isAvailable: missingItems.length === 0,
    missingItems,
  };
}

// Update inventory when order is shipped
export async function updateInventoryOnShipment(orderId: string): Promise<void> {
  const supabase = getAdminClient();

  // Get order items
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  if (!orderItems || orderItems.length === 0) {
    return;
  }

  // Update inventory for each item and log transaction
  for (const item of orderItems) {
    // Get current inventory and reorder level
    const { data: drug, error: drugError } = await supabase
      .from('otc_drugs')
      .select('quantity_on_hand, reorder_level')
      .eq('id', item.drug_id)
      .single();

    if (drugError) continue;

    const quantityBefore = drug?.quantity_on_hand || 0;
    const quantityAfter = Math.max(0, quantityBefore - item.quantity);
    const reorderLevel = drug?.reorder_level || 10;
    const isLowStock = quantityAfter <= reorderLevel;

    // Update OTC drug inventory and low stock alert
    const { error: updateError } = await supabase
      .from('otc_drugs')
      .update({
        quantity_on_hand: quantityAfter,
        low_stock_alert: isLowStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.drug_id);

    if (updateError) {
      console.error(`Failed to update inventory for drug ${item.drug_id}:`, updateError);
      continue;
    }

    // Log inventory transaction
    const { error: transError } = await supabase
      .from('inventory_transactions')
      .insert({
        drug_id: item.drug_id,
        drug_type: 'otc',
        transaction_type: 'sale',
        quantity_change: -item.quantity,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        notes: `Order shipment - Order ID: ${orderId}`,
        created_by: (await supabase.auth.getUser()).data.user?.id || null,
      });

    if (transError) {
      console.error(`Failed to log transaction for drug ${item.drug_id}:`, transError);
    }
  }

  revalidatePath('/admin/inventory');
}
export async function getAdminOrderWithItems(orderId: string): Promise<OrderWithItems> {
  const supabase = getAdminClient();

  // Get order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, order_number, status, total_amount, subtotal_amount, tax_amount, shipping_amount, shipping_collect_on_delivery, shipping_estimated_amount, shipping_custom_rate, shipping_paid_online, shipping_custom_rate_collect_on_delivery, payment_status, payment_method, receipt_url, transaction_id, is_prescription_order, prescription_id, doctor_prescription_id, shipping_street_line_1, shipping_street_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_street_line_1, billing_street_line_2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at')
    .eq('id', orderId)
    .single();

  if (orderError) throw new Error(orderError.message);

  // Get order items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  return {
    ...(order as Order),
    items: items as OrderItem[],
  };
}

export async function updateOrderShipping(
  orderId: string,
  shippingAmount: number
): Promise<Order> {
  const supabase = getAdminClient();

  // First, get the current order to calculate subtotal correctly
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // Calculate subtotal (items + tax, without old shipping)
  const subtotal = currentOrder.total_amount - currentOrder.shipping_amount;
  
  // Calculate new total
  const newTotal = subtotal + shippingAmount;

  // Update both shipping_amount and total_amount
  const { data, error } = await supabase
    .from('orders')
    .update({
      shipping_amount: shippingAmount,
      total_amount: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
  return data as Order;
}

// Update custom shipping rate for orders without standard rates
export async function updateCustomShippingRate(
  orderId: string,
  customRate: number
): Promise<Order> {
  const supabase = getAdminClient();

  // First, get the current order
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  // Calculate subtotal (items + tax, without old shipping_amount)
  const subtotal = currentOrder.total_amount - (currentOrder.shipping_amount || 0);
  
  // Calculate new total with custom rate
  const newTotal = subtotal + customRate;

  // Update shipping_custom_rate and total_amount
  const { data, error } = await supabase
    .from('orders')
    .update({
      shipping_custom_rate: customRate,
      shipping_amount: customRate,
      total_amount: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
  return data as Order;
}

// Update shipping payment status (online vs on delivery) for custom rates
export async function updateCustomShippingPaymentStatus(
  orderId: string,
  paidOnline: boolean
): Promise<Order> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .update({
      shipping_paid_online: paidOnline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/patient/orders');
  return data as Order;
}

// Update custom rate COD flag and recalculate total
export async function updateCustomRateCOD(
  orderId: string,
  collectOnDelivery: boolean
): Promise<Order> {
  'use server';

  const supabase = getAdminClient();

  // First, get the current order to calculate new total
  const { data: currentOrder, error: fetchError } = await supabase
    .from('orders')
    .select('total_amount, shipping_custom_rate, shipping_custom_rate_collect_on_delivery')
    .eq('id', orderId)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (!currentOrder) throw new Error('Order not found');

  // Calculate new total amount
  // If enabling COD: subtract shipping_custom_rate from total
  // If disabling COD: add shipping_custom_rate back to total
  let newTotalAmount = currentOrder.total_amount;
  
  if (collectOnDelivery && !currentOrder.shipping_custom_rate_collect_on_delivery) {
    // Enabling COD: remove shipping from total
    newTotalAmount = currentOrder.total_amount - (currentOrder.shipping_custom_rate || 0);
  } else if (!collectOnDelivery && currentOrder.shipping_custom_rate_collect_on_delivery) {
    // Disabling COD: add shipping back to total
    newTotalAmount = currentOrder.total_amount + (currentOrder.shipping_custom_rate || 0);
  }

  // Update order with new flag and recalculated total
  const { data, error } = await supabase
    .from('orders')
    .update({
      shipping_custom_rate_collect_on_delivery: collectOnDelivery,
      total_amount: newTotalAmount,
    })
    .eq('id', orderId)
    .select(
      'id, user_id, order_number, status, total_amount, subtotal_amount, tax_amount, shipping_amount, shipping_collect_on_delivery, shipping_estimated_amount, shipping_custom_rate, shipping_paid_online, shipping_custom_rate_collect_on_delivery, payment_status, payment_method, receipt_url, transaction_id, is_prescription_order, prescription_id, doctor_prescription_id, shipping_street_line_1, shipping_street_line_2, shipping_city, shipping_state, shipping_postal_code, shipping_country, billing_street_line_1, billing_street_line_2, billing_city, billing_state, billing_postal_code, billing_country, notes, created_at, updated_at'
    )
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/orders');
  return data as Order;
}

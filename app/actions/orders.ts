'use server';

import { Order, OrderItem, CartItem, OrderWithItems } from '@/lib/types/orders';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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
  shippingAddress: string,
  billingAddress: string,
  notes?: string
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
    });
  }

  // Use payment config for tax and shipping calculations
  // Tax: if inclusive, don't add extra tax (already in price); otherwise 0
  const tax = paymentConfig && paymentConfig.tax_type === 'inclusive' ? 0 : 0;
  
  // Shipping: use Kingston delivery cost from config
  const shipping = paymentConfig ? paymentConfig.kingston_delivery_cost : 0;
  
  const total = subtotal + tax + shipping;

  // Create order
  const orderNumber = generateOrderNumber();
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      order_number: orderNumber,
      status: 'pending',
      subtotal_amount: subtotal,
      tax_amount: tax,
      shipping_amount: shipping,
      total_amount: total,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
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
    .select('*')
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
    .select('*')
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

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Order[];
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
    // Get current inventory
    const { data: drug, error: drugError } = await supabase
      .from('otc_drugs')
      .select('quantity_on_hand')
      .eq('id', item.drug_id)
      .single();

    if (drugError) continue;

    const quantityBefore = drug?.quantity_on_hand || 0;
    const quantityAfter = Math.max(0, quantityBefore - item.quantity);

    // Update OTC drug inventory
    const { error: updateError } = await supabase
      .from('otc_drugs')
      .update({
        quantity_on_hand: quantityAfter,
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
    .select('*')
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

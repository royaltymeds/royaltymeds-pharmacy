'use server';

import { createServerClient } from '@supabase/ssr';
import nodemailer from 'nodemailer';
import {
  Supplier,
  RestockRequest,
  SupplierProduct,
  CreateRestockRequestInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateSupplierProductInput,
  RestockNotificationSettings,
} from '@/lib/types/restock';

// Service role client for admin operations (bypass RLS)
function getServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  );
}


function getSmtpTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatCurrency(amount: number | null | undefined) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendRestockRequestEmailNotification(
  to: string,
  request: RestockRequest,
  items: CreateRestockRequestInput['items']
) {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    console.warn('Restock email notification skipped because SMTP_USER or SMTP_PASS is not configured.');
    return;
  }

  const subject = `New restock request submitted: ${request.request_number}`;
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.product_name)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.product_type)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${item.quantity_requested}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.quantity_requested * item.unit_price)}</td>
        </tr>`
    )
    .join('');
  const textItems = items
    .map(
      (item) =>
        `- ${item.product_name} (${item.product_type}): ${item.quantity_requested} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.quantity_requested * item.unit_price)}`
    )
    .join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <h2 style="margin-bottom: 16px;">New Restock Request Submitted</h2>
        <p>A restock request was submitted and is ready for review.</p>
        <p><strong>Request number:</strong> ${escapeHtml(request.request_number)}</p>
        <p><strong>Total amount:</strong> ${formatCurrency(request.total_amount)}</p>
        ${request.expected_delivery_date ? `<p><strong>Expected delivery date:</strong> ${escapeHtml(request.expected_delivery_date)}</p>` : ''}
        <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: left;">Product</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: left;">Type</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Qty</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Unit price</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Line total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
    `,
    text: `New Restock Request Submitted

Request number: ${request.request_number}
Total amount: ${formatCurrency(request.total_amount)}${request.expected_delivery_date ? `
Expected delivery date: ${request.expected_delivery_date}` : ''}

Items:
${textItems}`,
  });
}

// ============================================================================
// SUPPLIER OPERATIONS
// ============================================================================

export async function createSupplier(input: CreateSupplierInput): Promise<{ data: Supplier | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name: input.name,
          contact_person: input.contact_person,
          email: input.email,
          phone: input.phone,
          address: input.address,
          city: input.city,
          payment_terms: input.payment_terms,
          lead_time_days: input.lead_time_days || 3,
          minimum_order_amount: input.minimum_order_amount || 0,
          notes: input.notes,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };


    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create supplier' };
  }
}

export async function updateSupplier(
  supplierId: string,
  input: UpdateSupplierInput
): Promise<{ data: Supplier | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('suppliers')
      .update(input)
      .eq('id', supplierId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update supplier' };
  }
}

export async function getSuppliers(): Promise<{ data: Supplier[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch suppliers' };
  }
}

export async function getSupplierById(supplierId: string): Promise<{ data: Supplier | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch supplier' };
  }
}

export async function deleteSupplier(supplierId: string): Promise<{ error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    // Soft delete by marking inactive
    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('id', supplierId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete supplier' };
  }
}

// ============================================================================
// SUPPLIER PRODUCTS OPERATIONS
// ============================================================================

export async function createSupplierProduct(
  input: CreateSupplierProductInput
): Promise<{ data: SupplierProduct | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .insert([
        {
          supplier_id: input.supplier_id,
          product_id: input.product_id,
          product_type: input.product_type,
          product_name: input.product_name,
          is_inventory_item: input.is_inventory_item ?? true,
          supplier_sku: input.supplier_sku,
          supplier_unit_price: input.supplier_unit_price,
          minimum_order_quantity: input.minimum_order_quantity || 1,
          reorder_frequency_id: input.reorder_frequency_id,
          notes: input.notes,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create supplier product' };
  }
}

export async function getSupplierProducts(
  supplierId: string
): Promise<{ data: SupplierProduct[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .select(
        `
        *,
        supplier:suppliers(*),
        frequency:restock_frequencies(*)
      `
      )
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch supplier products' };
  }
}

export async function updateSupplierProduct(
  productId: string,
  updates: Partial<SupplierProduct>
): Promise<{ data: SupplierProduct | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update supplier product' };
  }
}

export async function deleteSupplierProduct(productId: string): Promise<{ error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from('supplier_products')
      .update({ is_active: false })
      .eq('id', productId);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to delete supplier product' };
  }
}

// ============================================================================
// RESTOCK REQUEST OPERATIONS
// ============================================================================

export async function createRestockRequest(
  pharmacistId: string,
  input: CreateRestockRequestInput
): Promise<{ data: RestockRequest | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    // Generate unique request number
    const requestNumber = `RR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate total amount
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity_requested * item.unit_price, 0);

    // Create main request record
    const { data: requestData, error: requestError } = await supabase
      .from('restock_requests')
      .insert([
        {
          request_number: requestNumber,
          supplier_id: input.supplier_id,
          pharmacist_id: pharmacistId,
          status: 'pending',
          total_amount: totalAmount,
          expected_delivery_date: input.expected_delivery_date,
        },
      ])
      .select()
      .single();

    if (requestError) return { data: null, error: requestError.message };

    // Create line items
    const items = input.items.map((item) => ({
      restock_request_id: requestData.id,
      product_id: item.product_id,
      product_type: item.product_type,
      product_name: item.product_name,
      quantity_requested: item.quantity_requested,
      quantity_received: 0,
      unit_price: item.unit_price,
      total_price: item.quantity_requested * item.unit_price,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase.from('restock_items').insert(items);

    if (itemsError) {
      // Rollback request if items failed
      await supabase.from('restock_requests').delete().eq('id', requestData.id);
      return { data: null, error: itemsError.message };
    }

    try {
      const { data: settings } = await supabase
        .from('restock_notification_settings')
        .select('notification_email')
        .eq('user_id', pharmacistId)
        .single();

      const target = settings?.notification_email || process.env.RESTOCK_NOTIFICATION_EMAIL;
      if (target) {
        await sendRestockRequestEmailNotification(target, requestData, input.items);
      }
    } catch (notificationError) {
      console.error('Failed to send restock email notification', notificationError);
    }

    // Fetch complete request with items
    const { data, error } = await supabase
      .from('restock_requests')
      .select(
        `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
      )
      .eq('id', requestData.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create restock request' };
  }
}

export async function getRestockRequests(
  status?: string
): Promise<{ data: RestockRequest[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    let query = supabase.from('restock_requests').select(
      `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
    );

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch restock requests' };
  }
}

export async function getRestockRequestById(
  requestId: string
): Promise<{ data: RestockRequest | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('restock_requests')
      .select(
        `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
      )
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch restock request' };
  }
}

export async function approveRestockRequest(
  requestId: string,
  approverId: string,
  notes?: string
): Promise<{ data: RestockRequest | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    // Update request status
    const { error: updateError } = await supabase
      .from('restock_requests')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: approverId,
        approval_notes: notes,
      })
      .eq('id', requestId);

    if (updateError) return { data: null, error: updateError.message };

    // Add history entry
    const { data: oldData } = await supabase
      .from('restock_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    await supabase.from('restock_history').insert([
      {
        restock_request_id: requestId,
        action: 'approved',
        old_status: oldData?.status,
        new_status: 'approved',
        changed_by: approverId,
        notes,
      },
    ]);

    // Fetch updated request
    const { data, error } = await supabase
      .from('restock_requests')
      .select(
        `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
      )
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to approve restock request' };
  }
}

export async function rejectRestockRequest(
  requestId: string,
  rejecterId: string,
  reason: string
): Promise<{ data: RestockRequest | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { error: updateError } = await supabase
      .from('restock_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', requestId);

    if (updateError) return { data: null, error: updateError.message };

    // Add history entry
    await supabase.from('restock_history').insert([
      {
        restock_request_id: requestId,
        action: 'rejected',
        new_status: 'rejected',
        changed_by: rejecterId,
        notes: reason,
      },
    ]);

    // Fetch updated request
    const { data, error } = await supabase
      .from('restock_requests')
      .select(
        `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
      )
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to reject restock request' };
  }
}

export async function updateRestockRequestStatus(
  requestId: string,
  status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'received' | 'cancelled',
  updatedBy: string,
  notes?: string
): Promise<{ data: RestockRequest | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    // Get current status
    const { data: currentData } = await supabase
      .from('restock_requests')
      .select('status')
      .eq('id', requestId)
      .single();

    const updates: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamp based on status
    if (status === 'received') {
      updates.actual_delivery_date = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await supabase
      .from('restock_requests')
      .update(updates)
      .eq('id', requestId);

    if (updateError) return { data: null, error: updateError.message };

    // Add history entry
    await supabase.from('restock_history').insert([
      {
        restock_request_id: requestId,
        action: 'status_changed',
        old_status: currentData?.status,
        new_status: status,
        changed_by: updatedBy,
        notes,
      },
    ]);

    // Fetch updated request
    const { data, error } = await supabase
      .from('restock_requests')
      .select(
        `
        *,
        supplier:suppliers(*),
        items:restock_items(*)
      `
      )
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update restock request status' };
  }
}

export async function recordReceivedQuantities(
  itemUpdates: { itemId: string; quantity_received: number }[]
): Promise<{ error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    // Update all items in batch
    for (const update of itemUpdates) {
      const { error } = await supabase
        .from('restock_items')
        .update({ quantity_received: update.quantity_received })
        .eq('id', update.itemId);

      if (error) return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to record received quantities' };
  }
}

export async function getRestockHistory(
  requestId: string
): Promise<{ data: any[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('restock_history')
      .select('*')
      .eq('restock_request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch restock history' };
  }
}


export async function getRestockNotificationSettings(
  userId: string
): Promise<{ data: RestockNotificationSettings | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('restock_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch notification settings' };
  }
}

export async function upsertRestockNotificationSettings(
  userId: string,
  notificationEmail: string
): Promise<{ data: RestockNotificationSettings | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('restock_notification_settings')
      .upsert({
        user_id: userId,
        notification_email: notificationEmail || null,
      }, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to save notification settings' };
  }
}

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
  CreatePurchaseOrderInput,
  RestockNotificationSettings,
  UpdateRestockNotificationSettingsInput,
  UpdatePurchaseOrderInput,
} from '@/lib/types/restock';
import { generateRestockWorkflowNumber } from '@/lib/restock-number';

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


const RESTOCK_REQUEST_SELECT = `
  *,
  supplier:suppliers(*),
  pharmacist:users!restock_requests_pharmacist_id_fkey(
    email,
    user_profiles!user_profiles_user_id_fkey(full_name)
  ),
  items:restock_items(*)
`;

type RestockRequestWithNestedProfile = RestockRequest & {
  pharmacist?: RestockRequest['pharmacist'] & {
    user_profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null;
  };
};

function normalizeRestockRequestPharmacist(request: RestockRequestWithNestedProfile | null): RestockRequest | null {
  if (!request) return null;

  const profile = Array.isArray(request.pharmacist?.user_profiles)
    ? request.pharmacist?.user_profiles[0]
    : request.pharmacist?.user_profiles;

  return {
    ...request,
    pharmacist: request.pharmacist
      ? {
          email: request.pharmacist.email,
          full_name: profile?.full_name || undefined,
        }
      : undefined,
  };
}

function normalizeRestockRequests(data: RestockRequestWithNestedProfile[] | null): RestockRequest[] | null {
  return data?.map((request) => normalizeRestockRequestPharmacist(request) as RestockRequest) || null;
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
        <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: left;">Product</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: left;">Type</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Qty</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Unit cost</th>
              <th style="padding: 8px; border-bottom: 2px solid #d1d5db; text-align: right;">Line total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
    `,
    text: `New Restock Request Submitted

Request number: ${request.request_number}
Total amount: ${formatCurrency(request.total_amount)}

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
          reorder_schedule_type: input.reorder_schedule_type || null,
          reorder_schedule_start_date: input.reorder_schedule_start_date || null,
          reorder_schedule_custom_dates: input.reorder_schedule_custom_dates || [],
          reorder_schedule_is_recurring: input.reorder_schedule_is_recurring || false,
          reorder_schedule_notes: input.reorder_schedule_notes || null,
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


export async function createSupplierProductsBulk(
  inputs: CreateSupplierProductInput[]
): Promise<{ data: SupplierProduct[] | null; error: string | null }> {
  try {
    if (inputs.length === 0) return { data: [], error: null };
    const supabase = getServiceRoleClient();

    const { data, error } = await supabase
      .from('supplier_products')
      .insert(inputs.map((input) => ({
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
      })))
      .select();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to bulk link supplier products' };
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
    const requestNumber = generateRestockWorkflowNumber('RR');

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
          status: 'requested',
          total_amount: totalAmount,
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
        .maybeSingle();

      const target = settings?.notification_email;
      if (target) {
        await sendRestockRequestEmailNotification(target, requestData, input.items);
      }
    } catch (notificationError) {
      console.error('Failed to send restock email notification', notificationError);
    }

    await attachRequestToOpenPurchaseOrder(supabase, requestData.id, input.supplier_id);

    // Fetch complete request with items
    const { data, error } = await supabase
      .from('restock_requests')
      .select(RESTOCK_REQUEST_SELECT)
      .eq('id', requestData.id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequestPharmacist(data), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create restock request' };
  }
}

export async function getRestockRequests(
  status?: string
): Promise<{ data: RestockRequest[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    let query = supabase.from('restock_requests').select(RESTOCK_REQUEST_SELECT);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequests(data), error: null };
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
      .select(RESTOCK_REQUEST_SELECT)
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequestPharmacist(data), error: null };
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
      .select(RESTOCK_REQUEST_SELECT)
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequestPharmacist(data), error: null };
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
      .select(RESTOCK_REQUEST_SELECT)
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequestPharmacist(data), error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to reject restock request' };
  }
}

export async function updateRestockRequestStatus(
  requestId: string,
  status: 'requested' | 'linked_to_po' | 'received' | 'cancelled',
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
      .select(RESTOCK_REQUEST_SELECT)
      .eq('id', requestId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: normalizeRestockRequestPharmacist(data), error: null };
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


// ============================================================================
// REORDER SCHEDULE + PURCHASE ORDER OPERATIONS
// ============================================================================

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addCalendarMonths(date: Date, monthOffset: number) {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + monthOffset;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDayOfTargetMonth));
}

function getNextMonthlyReorderDate(startDate: Date, today: Date) {
  const monthDifference = (today.getFullYear() - startDate.getFullYear()) * 12 + today.getMonth() - startDate.getMonth();
  let monthOffset = Math.max(0, monthDifference);
  let candidate = addCalendarMonths(startDate, monthOffset);

  if (candidate < today) {
    monthOffset += 1;
    candidate = addCalendarMonths(startDate, monthOffset);
  }

  return candidate;
}

function toDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getUpcomingReorders(): Promise<{ data: import('@/lib/types/restock').UpcomingReorder[] | null; error: string | null }> {
  try {
    const { data: suppliers, error } = await getSuppliers();
    if (error) return { data: null, error };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = (suppliers || []).map((supplier) => {
      let next: string | null = null;
      let label = 'No schedule set';
      const scheduleType = supplier.reorder_schedule_type;
      const customDates = supplier.reorder_schedule_custom_dates || [];

      if (scheduleType === 'daily' || scheduleType === 'weekly' || scheduleType === 'bi_weekly' || scheduleType === 'three_weeks' || scheduleType === 'monthly') {
        let cursor = parseDateOnly(supplier.reorder_schedule_start_date) || today;
        if (scheduleType === 'monthly') {
          cursor = getNextMonthlyReorderDate(cursor, today);
        } else {
          const intervalBySchedule = { daily: 1, weekly: 7, bi_weekly: 14, three_weeks: 21 } as const;
          const interval = intervalBySchedule[scheduleType];
          while (cursor < today) cursor = addDays(cursor, interval);
        }
        next = toDateOnly(cursor);
        label = scheduleType === 'daily' ? 'Daily' : scheduleType === 'weekly' ? 'Weekly' : scheduleType === 'bi_weekly' ? 'Bi-weekly' : scheduleType === 'three_weeks' ? 'Every 3 weeks' : 'Monthly';
      } else if (scheduleType === 'custom') {
        const sorted = customDates.filter(Boolean).sort();
        next = sorted.find((date) => (parseDateOnly(date) || today) >= today) || null;
        if (!next && supplier.reorder_schedule_is_recurring && sorted.length > 0) {
          const first = parseDateOnly(sorted[0]);
          if (first) next = toDateOnly(new Date(today.getFullYear() + 1, first.getMonth(), first.getDate()));
        }
        label = supplier.reorder_schedule_is_recurring ? 'Custom recurring dates' : 'Custom dates';
      }

      return { supplier, next_reorder_date: next, schedule_label: label };
    });

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to calculate upcoming reorders' };
  }
}

export async function getPurchaseOrders(status?: string): Promise<{ data: import('@/lib/types/restock').PurchaseOrder[] | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    let query = supabase.from('purchase_orders').select(`
      *,
      supplier:suppliers(*),
      items:purchase_order_items(*)
    `);

    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch purchase orders' };
  }
}

export async function getPurchaseOrderById(poId: string): Promise<{ data: import('@/lib/types/restock').PurchaseOrder | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from('purchase_orders').select(`
      *,
      supplier:suppliers(*),
      items:purchase_order_items(*)
    `).eq('id', poId).single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch purchase order' };
  }
}


function mergePurchaseOrderItems(requests: any[], purchaseOrderId: string) {
  const merged = new Map<string, any>();

  for (const request of requests || []) {
    for (const item of request.items || []) {
      const key = [item.product_id, item.product_type, Number(item.unit_price || 0).toFixed(4)].join('|');
      const existing = merged.get(key);
      if (existing) {
        existing.quantity_ordered += Number(item.quantity_requested || 0);
        existing.total_price += Number(item.total_price || 0);
        existing.notes = [existing.notes, item.notes].filter(Boolean).join(' | ');
        existing.source_restock_item_ids.push(item.id);
        existing.source_restock_request_ids.add(request.id);
      } else {
        merged.set(key, {
          purchase_order_id: purchaseOrderId,
          restock_request_id: request.id,
          restock_item_id: item.id,
          product_id: item.product_id,
          product_type: item.product_type,
          product_name: item.product_name,
          quantity_ordered: Number(item.quantity_requested || 0),
          quantity_received: 0,
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          notes: item.notes,
          source_restock_item_ids: [item.id],
          source_restock_request_ids: new Set([request.id]),
        });
      }
    }
  }

  return Array.from(merged.values());
}

async function attachRequestToOpenPurchaseOrder(supabase: ReturnType<typeof getServiceRoleClient>, requestId: string, supplierId: string) {
  const { data: purchaseOrder } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'open')
    .order('reorder_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!purchaseOrder) return;

  const { data: items, error: itemsError } = await supabase
    .from('restock_items')
    .select('*')
    .eq('restock_request_id', requestId);
  if (itemsError || !items?.length) return;

  const poItems = items.map((item) => ({
    purchase_order_id: purchaseOrder.id,
    restock_request_id: requestId,
    restock_item_id: item.id,
    product_id: item.product_id,
    product_type: item.product_type,
    product_name: item.product_name,
    quantity_ordered: item.quantity_requested,
    quantity_received: 0,
    unit_price: item.unit_price,
    total_price: item.total_price,
    notes: item.notes,
  }));

  const { data: inserted } = await supabase.from('purchase_order_items').insert(poItems).select('id, restock_item_id');
  if (inserted?.length) {
    for (const insertedItem of inserted) {
      await supabase
        .from('restock_items')
        .update({ purchase_order_item_id: insertedItem.id })
        .eq('id', insertedItem.restock_item_id);
    }
  }

  const addedTotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  await supabase
    .from('purchase_orders')
    .update({ total_amount: Number(purchaseOrder.total_amount || 0) + addedTotal, updated_at: new Date().toISOString() })
    .eq('id', purchaseOrder.id);

  await supabase
    .from('restock_requests')
    .update({ purchase_order_id: purchaseOrder.id, status: 'linked_to_po', updated_at: new Date().toISOString() })
    .eq('id', requestId);
}

export async function createPurchaseOrder(
  createdBy: string,
  input: CreatePurchaseOrderInput
): Promise<{ data: import('@/lib/types/restock').PurchaseOrder | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const poNumber = generateRestockWorkflowNumber('PO');

    const { data: requests, error: requestsError } = await supabase
      .from('restock_requests')
      .select('*, items:restock_items(*)')
      .eq('supplier_id', input.supplier_id)
      .in('status', ['requested'])
      .is('purchase_order_id', null)
      .order('created_at', { ascending: true });

    if (requestsError) return { data: null, error: requestsError.message };

    const totalAmount = (requests || []).reduce(
      (sum, request) => sum + Number(request.total_amount || 0),
      0
    );

    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: input.supplier_id,
        created_by: createdBy,
        status: 'open',
        reorder_date: input.reorder_date,
        is_custom_reorder_date: input.is_custom_reorder_date || false,
        total_amount: totalAmount,
        notes: input.notes,
        source: input.source || (input.is_custom_reorder_date ? 'manual' : 'scheduled'),
      })
      .select()
      .single();

    if (poError) return { data: null, error: poError.message };

    if ((input.source || (input.is_custom_reorder_date ? 'manual' : 'scheduled')) !== 'manual') {
      const mergedItems = mergePurchaseOrderItems(requests || [], po.id);
      const poItems = mergedItems.map(({ source_restock_item_ids, source_restock_request_ids, ...item }) => item);

      if (poItems.length > 0) {
        const { data: insertedItems, error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(poItems)
          .select('id, restock_item_id');

        if (itemsError) {
          await supabase.from('purchase_orders').delete().eq('id', po.id);
          return { data: null, error: itemsError.message };
        }

        for (const insertedItem of insertedItems || []) {
          const mergedItem = mergedItems.find((item) => item.restock_item_id === insertedItem.restock_item_id);
          await supabase
            .from('restock_items')
            .update({ purchase_order_item_id: insertedItem.id })
            .in('id', mergedItem?.source_restock_item_ids || [insertedItem.restock_item_id]);
        }
      }

      const requestIds = (requests || []).map((request) => request.id);
      if (requestIds.length > 0) {
        await supabase
          .from('restock_requests')
          .update({ purchase_order_id: po.id, status: 'linked_to_po', updated_at: new Date().toISOString() })
          .in('id', requestIds);
      }
    }

    return getPurchaseOrderById(po.id);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create purchase order' };
  }
}


export async function placePurchaseOrder(
  purchaseOrderId: string,
  expectedDeliveryDate: string
): Promise<{ data: import('@/lib/types/restock').PurchaseOrder | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'placed',
        expected_delivery_date: expectedDeliveryDate,
        placed_at: now,
        updated_at: now,
      })
      .eq('id', purchaseOrderId);

    if (error) return { data: null, error: error.message };
    return getPurchaseOrderById(purchaseOrderId);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to place purchase order' };
  }
}

export async function updatePurchaseOrder(
  purchaseOrderId: string,
  input: UpdatePurchaseOrderInput
): Promise<{ data: import('@/lib/types/restock').PurchaseOrder | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();
    const totalAmount = input.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_price, 0);

    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({ notes: input.notes, total_amount: totalAmount, updated_at: now })
      .eq('id', purchaseOrderId);
    if (poError) return { data: null, error: poError.message };

    const { data: currentItems, error: currentError } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId);
    if (currentError) return { data: null, error: currentError.message };

    const submittedIds = input.items.map((item) => item.itemId).filter(Boolean) as string[];
    const removedItems = (currentItems || []).filter((item) => !submittedIds.includes(item.id));

    for (const removedItem of removedItems) {
      if (removedItem.restock_item_id) {
        await supabase
          .from('restock_items')
          .update({ purchase_order_item_id: null, updated_at: now })
          .eq('id', removedItem.restock_item_id);
      }
      if (removedItem.restock_request_id) {
        await supabase
          .from('restock_requests')
          .update({ purchase_order_id: null, status: 'requested', updated_at: now })
          .eq('id', removedItem.restock_request_id);
      }
    }

    if (removedItems.length > 0) {
      const removedIds = removedItems.map((item) => item.id);
      const { error: deleteError } = await supabase.from('purchase_order_items').delete().in('id', removedIds);
      if (deleteError) return { data: null, error: deleteError.message };
    }

    for (const item of input.items) {
      const total_price = item.quantity_ordered * item.unit_price;
      if (item.itemId) {
        const { error: updateError } = await supabase
          .from('purchase_order_items')
          .update({
            product_id: item.product_id,
            product_type: item.product_type,
            product_name: item.product_name,
            quantity_ordered: item.quantity_ordered,
            unit_price: item.unit_price,
            total_price,
            notes: item.notes,
            updated_at: now,
          })
          .eq('id', item.itemId);
        if (updateError) return { data: null, error: updateError.message };
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('purchase_order_items')
          .insert({
            purchase_order_id: purchaseOrderId,
            restock_request_id: item.restock_request_id,
            restock_item_id: item.restock_item_id,
            product_id: item.product_id,
            product_type: item.product_type,
            product_name: item.product_name,
            quantity_ordered: item.quantity_ordered,
            quantity_received: 0,
            unit_price: item.unit_price,
            total_price,
            notes: item.notes,
          })
          .select('id')
          .single();
        if (insertError) return { data: null, error: insertError.message };
        if (inserted?.id && item.restock_item_id) {
          await supabase
            .from('restock_items')
            .update({ purchase_order_item_id: inserted.id, updated_at: now })
            .eq('id', item.restock_item_id);
        }
      }

      if (item.restock_item_id) {
        const { error: restockItemError } = await supabase
          .from('restock_items')
          .update({
            product_id: item.product_id,
            product_type: item.product_type,
            product_name: item.product_name,
            quantity_requested: item.quantity_ordered,
            unit_price: item.unit_price,
            total_price,
            notes: item.notes,
            updated_at: now,
          })
          .eq('id', item.restock_item_id);
        if (restockItemError) return { data: null, error: restockItemError.message };
      }
    }

    const requestIds = Array.from(new Set(input.items.map((item) => item.restock_request_id).filter(Boolean))) as string[];
    for (const requestId of requestIds) {
      const { data: restockItems } = await supabase
        .from('restock_items')
        .select('total_price')
        .eq('restock_request_id', requestId);
      const requestTotal = (restockItems || []).reduce((sum, item) => sum + Number(item.total_price || 0), 0);
      await supabase
        .from('restock_requests')
        .update({ purchase_order_id: purchaseOrderId, status: 'linked_to_po', total_amount: requestTotal, updated_at: now })
        .eq('id', requestId);
    }

    return getPurchaseOrderById(purchaseOrderId);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update purchase order' };
  }
}

export async function updatePurchaseOrderStatus(
  purchaseOrderId: string,
  status: 'open' | 'placed' | 'received' | 'cancelled',
  itemUpdates?: { itemId: string; quantity_received: number }[]
): Promise<{ data: import('@/lib/types/restock').PurchaseOrder | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();

    for (const update of itemUpdates || []) {
      await supabase
        .from('purchase_order_items')
        .update({ quantity_received: update.quantity_received, updated_at: new Date().toISOString() })
        .eq('id', update.itemId);
    }

    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === 'placed') updates.placed_at = new Date().toISOString();
    if (status === 'received') updates.received_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

    const { error: updateError } = await supabase.from('purchase_orders').update(updates).eq('id', purchaseOrderId);
    if (updateError) return { data: null, error: updateError.message };

    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId);

    if (status === 'received') {
      for (const item of poItems || []) {
        await supabase
          .from('restock_items')
          .update({ quantity_received: item.quantity_received, updated_at: new Date().toISOString() })
          .eq('id', item.restock_item_id);
      }

      const itemsByRequest = (poItems || []).reduce<Record<string, any[]>>((groups, item) => {
        if (!item.restock_request_id) return groups;
        groups[item.restock_request_id] = [...(groups[item.restock_request_id] || []), item];
        return groups;
      }, {});

      for (const [requestId, requestItems] of Object.entries(itemsByRequest)) {
        const anyReceived = requestItems.some((item) => Number(item.quantity_received || 0) > 0);
        await supabase
          .from('restock_requests')
          .update({
            status: anyReceived ? 'received' : 'cancelled',
            actual_delivery_date: anyReceived ? toDateOnly(new Date()) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);
      }
    }

    if (status === 'cancelled') {
      const requestIds = Array.from(new Set((poItems || []).map((item) => item.restock_request_id).filter(Boolean)));
      if (requestIds.length > 0) {
        await supabase
          .from('restock_requests')
          .update({ status: 'requested', purchase_order_id: null, updated_at: new Date().toISOString() })
          .in('id', requestIds);
      }
      await supabase.from('restock_items').update({ purchase_order_item_id: null }).in(
        'id',
        (poItems || []).map((item) => item.restock_item_id).filter(Boolean)
      );
    }

    return getPurchaseOrderById(purchaseOrderId);
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to update purchase order' };
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

function isMissingRestockNotificationChannelColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false;

  const message = error.message || '';
  return (
    (error.code === 'PGRST204' || message.includes('schema cache')) &&
    message.includes('restock_notification_settings') &&
    (message.includes('whatsapp_notifications_enabled') ||
      message.includes('sms_notifications_enabled') ||
      message.includes('app_toast_notifications_enabled') ||
      message.includes('push_notifications_enabled'))
  );
}

export async function upsertRestockNotificationSettings(
  userId: string,
  input: UpdateRestockNotificationSettingsInput
): Promise<{ data: RestockNotificationSettings | null; error: string | null }> {
  try {
    const supabase = getServiceRoleClient();
    const notification_email = input.notification_email || null;

    const { data, error } = await supabase
      .from('restock_notification_settings')
      .upsert(
        {
          user_id: userId,
          notification_email,
          whatsapp_notifications_enabled: input.whatsapp_notifications_enabled,
          sms_notifications_enabled: input.sms_notifications_enabled,
          app_toast_notifications_enabled: input.app_toast_notifications_enabled,
          push_notifications_enabled: input.push_notifications_enabled,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (!error) return { data, error: null };

    if (!isMissingRestockNotificationChannelColumnError(error)) {
      return { data: null, error: error.message };
    }

    console.warn(
      'Restock notification channel preference columns are missing from the database schema cache; saving email only.',
      error.message
    );

    const { data: emailOnlyData, error: emailOnlyError } = await supabase
      .from('restock_notification_settings')
      .upsert(
        {
          user_id: userId,
          notification_email,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (emailOnlyError) return { data: null, error: emailOnlyError.message };
    return { data: emailOnlyData, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to save notification settings' };
  }
}

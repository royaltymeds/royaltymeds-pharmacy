'use server';

import { createServerSupabaseClient, createServerAdminClient } from '@/lib/supabase-server';
import { PaymentConfig } from '@/lib/types/payments';

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('payment_config')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found, return null
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching payment config:', error);
    throw error;
  }
}

export async function updatePaymentConfig(config: Partial<PaymentConfig>): Promise<PaymentConfig> {
  try {
    const supabase = await createServerAdminClient();

    // First check if config exists
    const { data: existing } = await (supabase as any)
      .from('payment_config')
      .select('id')
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await (supabase as any)
        .from('payment_config')
        .update(config)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await (supabase as any)
        .from('payment_config')
        .insert([config])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error updating payment config:', error);
    throw error;
  }
}

export async function uploadPaymentReceipt(file: File, orderId: string): Promise<string> {
  try {
    const supabase = await createServerAdminClient();
    const fileName = `receipts/${orderId}-${Date.now()}-${file.name}`;

    const { data, error } = await (supabase as any).storage
      .from('royaltymeds_storage')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = (supabase as any).storage
      .from('royaltymeds_storage')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: string,
  paymentMethod?: string,
  receiptUrl?: string
): Promise<void> {
  try {
    const supabase = await createServerAdminClient();

    const updateData: any = { payment_status: paymentStatus };
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (receiptUrl) updateData.receipt_url = receiptUrl;

    const { error } = await (supabase as any)
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating order payment status:', error);
    throw error;
  }
}

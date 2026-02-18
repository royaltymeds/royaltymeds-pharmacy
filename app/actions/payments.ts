'use server';

import { createServerSupabaseClient, createServerAdminClient } from '@/lib/supabase-server';
import { PaymentConfig, ShippingRate } from '@/lib/types/payments';

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

    const updateData: any = { 
      payment_status: paymentStatus,
      status: 'payment_pending' // Set order status to payment_pending when receipt is uploaded
    };
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

export async function verifyPayment(orderId: string): Promise<void> {
  try {
    const supabase = await createServerAdminClient();

    const { error } = await (supabase as any)
      .from('orders')
      .update({ 
        payment_status: 'paid',
        status: 'payment_verified' // Set order status to payment_verified when admin verifies
      })
      .eq('id', orderId);

    if (error) throw error;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

// Shipping Rates Management
export async function getShippingRates(): Promise<ShippingRate[]> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .order('parish', { ascending: true })
      .order('city_town', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    throw error;
  }
}

export async function createShippingRate(rate: Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>): Promise<ShippingRate> {
  try {
    const supabase = await createServerAdminClient();

    // If this is being set as default, unset all other defaults
    if (rate.is_default) {
      await (supabase as any)
        .from('shipping_rates')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await (supabase as any)
      .from('shipping_rates')
      .insert([rate])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    throw error;
  }
}

export async function updateShippingRate(id: string, rate: Partial<ShippingRate>): Promise<ShippingRate> {
  try {
    const supabase = await createServerAdminClient();

    // If this is being set as default, unset all other defaults
    if (rate.is_default) {
      await (supabase as any)
        .from('shipping_rates')
        .update({ is_default: false })
        .neq('id', id);
    }

    const { data, error } = await (supabase as any)
      .from('shipping_rates')
      .update(rate)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    throw error;
  }
}

export async function deleteShippingRate(id: string): Promise<void> {
  try {
    const supabase = await createServerAdminClient();

    const { error } = await (supabase as any)
      .from('shipping_rates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    throw error;
  }
}

export async function getShippingRateByLocation(parish: string, cityTown?: string): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();

    console.log('[Shipping Rate Lookup] Parish:', parish, 'City:', cityTown);

    // Trim and normalize inputs
    const normalizedParish = parish?.trim() || '';
    const normalizedCity = cityTown?.trim() || '';

    // First try to find a rate for the specific parish + city/town combination (case-insensitive)
    if (normalizedCity) {
      const { data: exactMatch, error: exactError } = await supabase
        .from('shipping_rates')
        .select('rate, parish, city_town')
        .ilike('parish', normalizedParish)
        .ilike('city_town', normalizedCity)
        .single();

      if (!exactError && exactMatch) {
        console.log('[Shipping Rate Lookup] Found exact match:', exactMatch);
        return exactMatch.rate;
      }
      console.log('[Shipping Rate Lookup] No exact match found');
    }

    // Then try to find a rate for just the parish with city_town as null (case-insensitive)
    const { data: parishMatch, error: parishError } = await supabase
      .from('shipping_rates')
      .select('rate, parish, city_town')
      .ilike('parish', normalizedParish)
      .is('city_town', null)
      .single();

    if (!parishError && parishMatch) {
      console.log('[Shipping Rate Lookup] Found parish match:', parishMatch);
      return parishMatch.rate;
    }
    console.log('[Shipping Rate Lookup] No parish match found. Parish error:', parishError?.message);

    // Finally, fall back to the default shipping rate from payment_config
    const { data: config, error: configError } = await supabase
      .from('payment_config')
      .select('default_shipping_cost')
      .single();

    if (configError || !config) {
      console.log('[Shipping Rate Lookup] No config found, returning 0');
      return 0; // No rate found, default to 0
    }

    console.log('[Shipping Rate Lookup] Using default shipping cost:', config.default_shipping_cost);
    return config.default_shipping_cost || 0;
  } catch (error) {
    console.error('[Shipping Rate Lookup] Error fetching shipping rate by location:', error);
    // Return 0 on error to prevent breaking the checkout
    return 0;
  }
}

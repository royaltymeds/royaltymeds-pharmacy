'use server';

import { OTCDrug, PrescriptionDrug, DrugType } from '@/lib/types/inventory';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Create an admin client that bypasses RLS using service role key
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

export async function getOTCDrugs() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('otc_drugs')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as OTCDrug[];
}

export async function getPrescriptionDrugs() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('prescription_drugs')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data as PrescriptionDrug[];
}

export async function getOTCDrugById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('otc_drugs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as OTCDrug;
}

export async function getPrescriptionDrugById(id: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('prescription_drugs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as PrescriptionDrug;
}

export async function createOTCDrug(drug: Omit<OTCDrug, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('otc_drugs')
    .insert([drug])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
  return data as OTCDrug;
}

export async function createPrescriptionDrug(drug: Omit<PrescriptionDrug, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('prescription_drugs')
    .insert([drug])
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
  return data as PrescriptionDrug;
}

export async function updateOTCDrug(id: string, updates: Partial<Omit<OTCDrug, 'id' | 'created_at'>>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('otc_drugs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
  return data as OTCDrug;
}

export async function updatePrescriptionDrug(id: string, updates: Partial<Omit<PrescriptionDrug, 'id' | 'created_at'>>) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('prescription_drugs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
  return data as PrescriptionDrug;
}

export async function deleteOTCDrug(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('otc_drugs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
}

export async function deletePrescriptionDrug(id: string) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('prescription_drugs')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/inventory');
}

export async function updateInventoryQuantity(
  drugType: DrugType,
  drugId: string,
  newQuantity: number,
  notes?: string
) {
  const supabase = getAdminClient();
  const tableName = drugType === 'otc' ? 'otc_drugs' : 'prescription_drugs';

  // Get current quantity first
  const { data: drug, error: fetchError } = await supabase
    .from(tableName)
    .select('quantity_on_hand, reorder_level')
    .eq('id', drugId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const oldQuantity = drug.quantity_on_hand;
  const quantityChange = newQuantity - oldQuantity;

  // Update drug quantity
  const { error: updateError } = await supabase
    .from(tableName)
    .update({
      quantity_on_hand: newQuantity,
      low_stock_alert: newQuantity <= (drug.reorder_level || 10),
      updated_at: new Date().toISOString(),
    })
    .eq('id', drugId);

  if (updateError) throw new Error(updateError.message);

  // Log transaction
  const { error: txError } = await supabase
    .from('inventory_transactions')
    .insert([
      {
        drug_id: drugId,
        drug_type: drugType,
        transaction_type: 'adjustment',
        quantity_change: quantityChange,
        quantity_before: oldQuantity,
        quantity_after: newQuantity,
        notes: notes,
      },
    ]);

  if (txError) throw new Error(txError.message);
  revalidatePath('/admin/inventory');
}

export async function getInventoryTransactions(drugId?: string, drugType?: DrugType) {
  const supabase = getAdminClient();
  let query = supabase.from('inventory_transactions').select('*');

  if (drugId) {
    query = query.eq('drug_id', drugId);
  }

  if (drugType) {
    query = query.eq('drug_type', drugType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLowStockItems() {
  const supabase = getAdminClient();
  
  const { data: otcLow, error: otcError } = await supabase
    .from('otc_drugs')
    .select('*')
    .eq('low_stock_alert', true)
    .order('name');

  const { data: rxLow, error: rxError } = await supabase
    .from('prescription_drugs')
    .select('*')
    .eq('low_stock_alert', true)
    .order('name');

  if (otcError || rxError) throw new Error(otcError?.message || rxError?.message);

  return {
    otc: (otcLow || []) as OTCDrug[],
    prescription: (rxLow || []) as PrescriptionDrug[],
  };
}

export async function searchInventory(query: string, drugType?: DrugType) {
  const supabase = getAdminClient();
  const searchTerm = `%${query}%`;

  if (drugType === 'otc') {
    const { data, error } = await supabase
      .from('otc_drugs')
      .select('*')
      .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
      .order('name');

    if (error) throw new Error(error.message);
    return { otc: data as OTCDrug[], prescription: [] };
  }

  if (drugType === 'prescription') {
    const { data, error } = await supabase
      .from('prescription_drugs')
      .select('*')
      .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
      .order('name');

    if (error) throw new Error(error.message);
    return { otc: [], prescription: data as PrescriptionDrug[] };
  }

  // Search both
  const { data: otcData, error: otcError } = await supabase
    .from('otc_drugs')
    .select('*')
    .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
    .order('name');

  const { data: rxData, error: rxError } = await supabase
    .from('prescription_drugs')
    .select('*')
    .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},manufacturer.ilike.${searchTerm}`)
    .order('name');

  if (otcError || rxError) throw new Error(otcError?.message || rxError?.message);

  return {
    otc: (otcData || []) as OTCDrug[],
    prescription: (rxData || []) as PrescriptionDrug[],
  };
}

// Upload image for inventory item
export async function uploadDrugImage(
  drugId: string,
  drugType: DrugType,
  file: File
): Promise<string> {
  const supabase = getAdminClient();

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }

  // Create unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${drugType}/${drugId}/${timestamp}.${fileExt}`;

  // Upload to storage
  const { data, error: uploadError } = await supabase.storage
    .from('royaltymeds_storage')
    .upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) throw new Error(uploadError.message);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('royaltymeds_storage')
    .getPublicUrl(data.path);

  const fileUrl = urlData.publicUrl;

  // Update database with file URL
  const tableName = drugType === 'otc' ? 'otc_drugs' : 'prescription_drugs';
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ file_url: fileUrl, updated_at: new Date().toISOString() })
    .eq('id', drugId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/admin/inventory');
  return fileUrl;
}

// Delete image for inventory item
export async function deleteDrugImage(
  drugId: string,
  drugType: DrugType,
  fileUrl: string
): Promise<void> {
  const supabase = getAdminClient();

  // Extract file path from URL
  const url = new URL(fileUrl);
  const pathParts = url.pathname.split('/');
  const filePath = pathParts.slice(4).join('/'); // Skip /storage/v1/object/public/{bucket}/

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('royaltymeds_storage')
    .remove([filePath]);

  if (deleteError) throw new Error(deleteError.message);

  // Update database to remove file URL
  const tableName = drugType === 'otc' ? 'otc_drugs' : 'prescription_drugs';
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ file_url: null, updated_at: new Date().toISOString() })
    .eq('id', drugId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath('/admin/inventory');
}


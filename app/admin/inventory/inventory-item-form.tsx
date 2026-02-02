'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { OTCDrug, PrescriptionDrug } from '@/lib/types/inventory';
import { uploadDrugImage, deleteDrugImage } from '@/app/actions/inventory';
import { DEFAULT_INVENTORY_IMAGE } from '@/lib/constants/inventory';
import { Upload, X } from 'lucide-react';

type Drug = OTCDrug | PrescriptionDrug;
type DrugType = 'otc' | 'prescription';

interface Props {
  drugType: DrugType;
  initialData?: Drug;
  categories: string[];
  subcategories: Record<string, string[]>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function InventoryItemForm({
  drugType,
  initialData,
  categories,
  subcategories,
  onSubmit,
  onCancel,
}: Props) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    sub_category: initialData?.sub_category || '',
    manufacturer: initialData?.manufacturer || '',
    sku: initialData?.sku || '',
    quantity_on_hand: initialData?.quantity_on_hand || 0,
    reorder_level: initialData?.reorder_level || 10,
    reorder_quantity: initialData?.reorder_quantity || 50,
    unit_price: initialData?.unit_price || 0,
    cost_price: initialData?.cost_price || 0,
    description: initialData?.description || '',
    indications: initialData?.indications || '',
    warnings: initialData?.warnings || '',
    side_effects: initialData?.side_effects || '',
    dosage: initialData?.dosage || '',
    active_ingredient: initialData?.active_ingredient || '',
    strength: initialData?.strength || '',
    pack_size: initialData?.pack_size || '',
    expiration_date: initialData?.expiration_date || '',
    lot_number: initialData?.lot_number || '',
    status: initialData?.status || 'active',
    notes: initialData?.notes || '',
    file_url: initialData?.file_url || null,
    is_on_sale: (initialData as OTCDrug)?.is_on_sale || false,
    sale_price: (initialData as OTCDrug)?.sale_price || 0,
    sale_discount_percent: (initialData as OTCDrug)?.sale_discount_percent || 0,
    sale_start_date: (initialData as OTCDrug)?.sale_start_date || '',
    sale_end_date: (initialData as OTCDrug)?.sale_end_date || '',
    ...(drugType === 'prescription' && {
      requires_refrigeration: (initialData as PrescriptionDrug)?.requires_refrigeration || false,
      controlled_substance: (initialData as PrescriptionDrug)?.controlled_substance || false,
    }),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const availableSubcategories = useMemo(
    () => subcategories[formData.category] || [],
    [formData.category, subcategories]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name.includes('price') || name.includes('quantity') || name.includes('reorder') 
          ? parseFloat(value) || 0
          : value,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploadingImage(true);

    try {
      // For new items, we need a temporary ID
      if (!initialData?.id) {
        setUploadError('Please save the item first before uploading an image');
        setIsUploadingImage(false);
        return;
      }

      const fileUrl = await uploadDrugImage(initialData.id, drugType, file);
      setFormData((prev) => ({
        ...prev,
        file_url: fileUrl,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleImageDelete = async () => {
    if (!initialData?.id || !formData.file_url) return;

    setUploadError('');
    setIsUploadingImage(true);

    try {
      await deleteDrugImage(initialData.id, drugType, formData.file_url);
      setFormData((prev) => ({
        ...prev,
        file_url: null,
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.sub_category || !formData.sku || !formData.unit_price) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Convert empty date strings to null
      const cleanedData = {
        ...formData,
        expiration_date: formData.expiration_date || null,
      };

      await onSubmit(cleanedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {uploadError}
        </div>
      )}

      {/* Image Upload Section */}
      {initialData?.id && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Image</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {formData.file_url || !initialData.file_url ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-40 h-40 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={formData.file_url || DEFAULT_INVENTORY_IMAGE}
                    alt={formData.name || 'Drug image'}
                    fill
                    className="object-cover"
                  />
                </div>
                {formData.file_url && (
                  <button
                    type="button"
                    onClick={handleImageDelete}
                    disabled={isUploadingImage}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={18} />
                    Delete Image
                  </button>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Upload size={18} />
                  <span>{formData.file_url ? 'Replace Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Upload size={32} className="text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Upload Item Image</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            )}
            {isUploadingImage && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Drug Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Drug Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub-Category <span className="text-red-500">*</span>
            </label>
            <select
              name="sub_category"
              value={formData.sub_category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!formData.category}
            >
              <option value="">Select Sub-Category</option>
              {availableSubcategories.map((subcat) => (
                <option key={subcat} value={subcat}>
                  {subcat}
                </option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Active Ingredient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Ingredient
            </label>
            <input
              type="text"
              name="active_ingredient"
              value={formData.active_ingredient}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Strength */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strength
            </label>
            <input
              type="text"
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              placeholder="e.g., 500mg, 10mg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Pack Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pack Size
            </label>
            <input
              type="text"
              name="pack_size"
              value={formData.pack_size}
              onChange={handleChange}
              placeholder="e.g., 30 tablets, 100ml"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Inventory Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity on Hand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity on Hand
            </label>
            <input
              type="number"
              name="quantity_on_hand"
              value={formData.quantity_on_hand}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level
            </label>
            <input
              type="number"
              name="reorder_level"
              value={formData.reorder_level}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Reorder Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Quantity
            </label>
            <input
              type="number"
              name="reorder_quantity"
              value={formData.reorder_quantity}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unit Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="unit_price"
              value={formData.unit_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Price
            </label>
            <input
              type="number"
              name="cost_price"
              value={formData.cost_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Sale Information */}
      {drugType === 'otc' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sale & Clearance</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                name="is_on_sale"
                checked={(formData as any).is_on_sale}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                Mark as On Sale / Clearance
              </label>
            </div>

            {(formData as any).is_on_sale && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {/* Sale Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="sale_price"
                    value={(formData as any).sale_price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sale Discount Percent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percent (%)
                  </label>
                  <input
                    type="number"
                    name="sale_discount_percent"
                    value={(formData as any).sale_discount_percent}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sale Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Start Date
                  </label>
                  <input
                    type="date"
                    name="sale_start_date"
                    value={(formData as any).sale_start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sale End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale End Date
                  </label>
                  <input
                    type="date"
                    name="sale_end_date"
                    value={(formData as any).sale_end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medication Details */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medication Details</h3>
        <div className="space-y-4">
          {/* Indications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indications (What it&apos;s used for)
            </label>
            <textarea
              name="indications"
              value={formData.indications}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Warnings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warnings & Contraindications
            </label>
            <textarea
              name="warnings"
              value={formData.warnings}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Side Effects */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Side Effects
            </label>
            <textarea
              name="side_effects"
              value={formData.side_effects}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dosage
            </label>
            <textarea
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              name="expiration_date"
              value={formData.expiration_date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lot Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lot Number
            </label>
            <input
              type="text"
              name="lot_number"
              value={formData.lot_number}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="discontinued">Discontinued</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          {/* Prescription-Specific Fields */}
          {drugType === 'prescription' && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="requires_refrigeration"
                  checked={(formData as any).requires_refrigeration}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Requires Refrigeration
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="controlled_substance"
                  checked={(formData as any).controlled_substance}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Controlled Substance
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Internal Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

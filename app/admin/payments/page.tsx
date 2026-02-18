'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Loader, Plus, Trash2 } from 'lucide-react';
import { getPaymentConfig, updatePaymentConfig, getShippingRates, createShippingRate, updateShippingRate, deleteShippingRate } from '@/app/actions/payments';
import { ShippingRate } from '@/lib/types/payments';

const JAMAICAN_PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Thomas',
  'Portland',
  'St. Mary',
  'St. Ann',
  'Trelawny',
  'St. James',
  'Hanover',
  'Westmoreland',
  'St. Elizabeth',
  'Manchester',
  'Clarendon',
  'St. Catherine',
];

export default function PaymentConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    bank_account_holder: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
    iban: '',
    swift_code: '',
    additional_instructions: '',
    tax_type: 'inclusive' as 'none' | 'inclusive',
    tax_rate: 15,
    default_shipping_cost: 0,
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [showAddRate, setShowAddRate] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState({
    parish: '',
    city_town: '',
    rate: 0,
    is_default: false,
  });
  const [editRate, setEditRate] = useState({
    parish: '',
    city_town: '',
    rate: 0,
  });
  const [savingRate, setSavingRate] = useState<string | null>(null);
  const [deletingRate, setDeletingRate] = useState<string | null>(null);

  // Load config and shipping rates
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await getPaymentConfig();
        if (data) {
          setFormData({
            bank_account_holder: data.bank_account_holder,
            bank_name: data.bank_name,
            account_number: data.account_number,
            routing_number: data.routing_number || '',
            iban: data.iban || '',
            swift_code: data.swift_code || '',
            additional_instructions: data.additional_instructions || '',
            tax_type: data.tax_type || 'inclusive',
            tax_rate: data.tax_rate || 15,
            default_shipping_cost: data.default_shipping_cost || data.kingston_delivery_cost || 0,
          });
        }

        const rates = await getShippingRates();
        setShippingRates(rates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'default_shipping_cost' || name === 'tax_rate' 
        ? parseFloat(value === '' ? '0' : value) || 0 
        : value,
    }));
  };

  const handleRateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewRate((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'rate' ? parseFloat(value === '' ? '0' : value) || 0 : 
              value,
    }));
  };

  const handleAddRate = async () => {
    try {
      if (!newRate.parish) {
        setError('Parish is required');
        return;
      }
      if (newRate.rate < 0) {
        setError('Rate must be a positive number');
        return;
      }

      setSavingRate('adding');
      setError('');

      await createShippingRate({
        parish: newRate.parish,
        city_town: newRate.city_town || null,
        rate: newRate.rate,
        is_default: newRate.is_default,
      });

      const updatedRates = await getShippingRates();
      setShippingRates(updatedRates);
      setNewRate({ parish: '', city_town: '', rate: 0, is_default: false });
      setShowAddRate(false);
      setSuccess('Shipping rate added successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shipping rate');
    } finally {
      setSavingRate(null);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate?')) {
      return;
    }

    try {
      setDeletingRate(id);
      await deleteShippingRate(id);
      setShippingRates(shippingRates.filter((r) => r.id !== id));
      setSuccess('Shipping rate deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shipping rate');
    } finally {
      setDeletingRate(null);
    }
  };

  const handleToggleDefault = async (id: string, currentDefault: boolean) => {
    try {
      setSavingRate(id);
      await updateShippingRate(id, { is_default: !currentDefault });
      const updatedRates = await getShippingRates();
      setShippingRates(updatedRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping rate');
    } finally {
      setSavingRate(null);
    }
  };

  const handleStartEdit = (rate: ShippingRate) => {
    setEditingRateId(rate.id);
    setEditRate({
      parish: rate.parish,
      city_town: rate.city_town || '',
      rate: rate.rate,
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingRateId(null);
    setEditRate({ parish: '', city_town: '', rate: 0 });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditRate((prev) => ({
      ...prev,
      [name]: name === 'rate' ? parseFloat(value === '' ? '0' : value) || 0 : value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      if (!editRate.parish) {
        setError('Parish is required');
        return;
      }
      if (editRate.rate < 0) {
        setError('Rate must be a positive number');
        return;
      }

      setSavingRate(editingRateId);
      setError('');

      await updateShippingRate(editingRateId!, {
        parish: editRate.parish,
        city_town: editRate.city_town || null,
        rate: editRate.rate,
      });

      const updatedRates = await getShippingRates();
      setShippingRates(updatedRates);
      setEditingRateId(null);
      setEditRate({ parish: '', city_town: '', rate: 0 });
      setSuccess('Shipping rate updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shipping rate');
    } finally {
      setSavingRate(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!formData.bank_account_holder || !formData.bank_name || !formData.account_number) {
        setError('Bank account holder, bank name, and account number are required');
        return;
      }

      await updatePaymentConfig(formData);
      setSuccess('Payment configuration saved successfully');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment config');
      setSuccess('');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600">Loading payment configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payment Configuration</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Configure bank account details for customer payments
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-green-600 hover:text-green-700 font-medium text-sm md:text-base whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6 flex gap-3">
            <AlertCircle className="flex-shrink-0 w-5 h-5 mt-0.5" />
            <p className="text-sm md:text-base">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6 flex gap-3">
            <Check className="flex-shrink-0 w-5 h-5 mt-0.5" />
            <p className="text-sm md:text-base">{success}</p>
          </div>
        )}

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Required Fields Section */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Required Information
              </h2>
              <div className="space-y-4 md:space-y-6">
                {/* Bank Account Holder */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    name="bank_account_holder"
                    value={formData.bank_account_holder}
                    onChange={handleInputChange}
                    placeholder="e.g., RoyaltyMeds Pharmacy Ltd"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Jamaica National Bank"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456789"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Additional Information (Optional)
              </h2>
              <div className="space-y-4 md:space-y-6">
                {/* Routing Number */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    name="routing_number"
                    value={formData.routing_number}
                    onChange={handleInputChange}
                    placeholder="e.g., 021000021"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* IBAN */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    IBAN
                  </label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban}
                    onChange={handleInputChange}
                    placeholder="e.g., JM26 JMCH 0000 0000 0000 0000 000"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* SWIFT Code */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    SWIFT Code
                  </label>
                  <input
                    type="text"
                    name="swift_code"
                    value={formData.swift_code}
                    onChange={handleInputChange}
                    placeholder="e.g., JMCHBR"
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* Additional Instructions */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Additional Instructions
                  </label>
                  <textarea
                    name="additional_instructions"
                    value={formData.additional_instructions}
                    onChange={handleInputChange}
                    placeholder="e.g., Please include your order number as the reference. Allow 1-2 business days for payment confirmation."
                    rows={4}
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base resize-none"
                  />
                  <p className="text-xs md:text-sm text-gray-500 mt-2">
                    These instructions will be displayed to customers when they choose to pay by bank transfer
                  </p>
                </div>
              </div>
            </div>

            {/* Tax Configuration Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Tax Configuration
              </h2>
              <div className="space-y-4 md:space-y-6">
                {/* Tax Type */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Tax Type
                  </label>
                  <select
                    name="tax_type"
                    value={formData.tax_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="inclusive">Tax Included (15% GCT Inclusive)</option>
                    <option value="none">No Tax</option>
                  </select>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">
                    {formData.tax_type === 'inclusive' 
                      ? 'When "Tax Included" is selected, the item price already includes 15% GCT, and this will be displayed to customers.'
                      : 'When "No Tax" is selected, no tax information will be displayed to customers.'}
                  </p>
                </div>

                {/* Tax Rate (disabled for display) */}
                {formData.tax_type === 'inclusive' && (
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                      Tax Rate (GCT %)
                    </label>
                    <input
                      type="text"
                      name="tax_rate"
                      value={formData.tax_rate || ''}
                      onChange={handleInputChange}
                      placeholder="15"
                      pattern="^[0-9]*(\.[0-9]{1,2})?$"
                      inputMode="decimal"
                      className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                    />
                    <p className="text-xs md:text-sm text-gray-500 mt-2">
                      The tax rate to display to customers (default: 15%)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping/Delivery Configuration Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Shipping & Delivery Configuration
              </h2>
              <div className="space-y-4 md:space-y-6">
                {/* Default Shipping Cost */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Default Shipping Cost (for all other locations) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-medium">JMD</span>
                    <input
                      type="text"
                      name="default_shipping_cost"
                      value={formData.default_shipping_cost || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 500"
                      pattern="^[0-9]*(\.[0-9]{1,2})?$"
                      inputMode="decimal"
                      className="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">
                    Default delivery cost applied to any location without a specific rate configured
                  </p>
                </div>

                {/* Location-Specific Rates Manager */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                      Location-Specific Rates
                    </h3>
                    {!showAddRate && (
                      <button
                        onClick={() => setShowAddRate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus size={18} />
                        Add Rate
                      </button>
                    )}
                  </div>

                  {/* Add New Rate Form */}
                  {showAddRate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parish *
                          </label>
                          <select
                            name="parish"
                            value={newRate.parish}
                            onChange={handleRateInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select Parish</option>
                            {JAMAICAN_PARISHES.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City/Town (Optional)
                          </label>
                          <input
                            type="text"
                            name="city_town"
                            value={newRate.city_town}
                            onChange={handleRateInputChange}
                            placeholder="e.g., Downtown Kingston"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rate (JMD) *
                          </label>
                          <input
                            type="text"
                            name="rate"
                            value={newRate.rate || ''}
                            onChange={handleRateInputChange}
                            placeholder="e.g., 500"
                            pattern="^[0-9]*(\.[0-9]{1,2})?$"
                            inputMode="decimal"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          name="is_default"
                          checked={newRate.is_default}
                          onChange={handleRateInputChange}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2"
                        />
                        <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                          Set as default rate
                        </label>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setShowAddRate(false);
                            setNewRate({ parish: '', city_town: '', rate: 0, is_default: false });
                          }}
                          className="px-3 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddRate}
                          disabled={savingRate !== null}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm flex items-center gap-1"
                        >
                          {savingRate && <Loader size={14} className="animate-spin" />}
                          Save Rate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Shipping Rates List */}
                  {shippingRates.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Parish</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">City/Town</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Rate (JMD)</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Default</th>
                              <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {shippingRates.map((rate) => (
                              editingRateId === rate.id ? (
                                <tr key={rate.id} className="bg-blue-50">
                                  <td className="px-4 py-3">
                                    <select
                                      name="parish"
                                      value={editRate.parish}
                                      onChange={handleEditInputChange}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select Parish</option>
                                      {JAMAICAN_PARISHES.map((p) => (
                                        <option key={p} value={p}>
                                          {p}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      name="city_town"
                                      value={editRate.city_town}
                                      onChange={handleEditInputChange}
                                      placeholder="Optional"
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="text"
                                      name="rate"
                                      value={editRate.rate || ''}
                                      onChange={handleEditInputChange}
                                      pattern="^[0-9]*(\.[0-9]{1,2})?$"
                                      inputMode="decimal"
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  </td>
                                  <td colSpan={2} className="px-4 py-3">
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={handleCancelEdit}
                                        className="px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSaveEdit}
                                        disabled={savingRate === rate.id}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                                      >
                                        {savingRate === rate.id && <Loader size={13} className="animate-spin" />}
                                        Save
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr key={rate.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-gray-900">{rate.parish}</td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {rate.city_town || <span className="text-gray-400">Whole parish</span>}
                                  </td>
                                  <td className="px-4 py-3 text-gray-900 font-medium">{rate.rate.toFixed(2)}</td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleToggleDefault(rate.id, rate.is_default)}
                                      disabled={savingRate === rate.id}
                                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                        rate.is_default
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                      } ${savingRate === rate.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      {rate.is_default ? 'Yes' : 'No'}
                                    </button>
                                  </td>
                                  <td className="px-4 py-3 text-right space-x-2">
                                    <button
                                      onClick={() => handleStartEdit(rate)}
                                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors text-xs"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRate(rate.id)}
                                      disabled={deletingRate === rate.id}
                                      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-xs"
                                    >
                                      {deletingRate === rate.id ? (
                                        <Loader size={14} className="animate-spin" />
                                      ) : (
                                        <Trash2 size={14} />
                                      )}
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              )
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {shippingRates.length === 0 && !showAddRate && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 text-sm mb-3">No location-specific rates configured yet</p>
                      <button
                        onClick={() => setShowAddRate(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus size={18} />
                        Add Your First Rate
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">How rates are applied:</h4>
                  <ul className="text-xs md:text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>If a specific parish + city/town combination exists, use that rate</li>
                    <li>Else if the parish exists (without city), use that rate</li>
                    <li>Else use the default shipping cost configured above</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-6 md:px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
              How Bank Transfer Payments Work
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
              <li>• Customers who choose to pay by bank transfer will receive these bank details</li>
              <li>• They will be asked to make a payment and upload a receipt</li>
              <li>• Admins can verify the payment by reviewing the uploaded receipt</li>
              <li>• Once verified, you can update the order status to mark it as paid</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">
              Tax & Delivery Settings
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
              <li>• Tax is set to &quot;inclusive&quot; by default - the item price includes 15% GCT</li>
              <li>• Customers will see that GCT is included in the price, but no additional amount is added</li>
              <li>• Shipping rates are applied based on parish and city/town from the customer&apos;s address</li>
              <li>• The default shipping cost is applied to locations without a specific rate configured</li>
              <li>• Each location rate can be marked as &quot;default&quot; for that particular location</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

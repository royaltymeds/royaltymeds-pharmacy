'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Loader } from 'lucide-react';
import { getPaymentConfig, updatePaymentConfig } from '@/app/actions/payments';

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
  });

  // Load config
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
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment config');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
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
      </div>
    </div>
  );
}

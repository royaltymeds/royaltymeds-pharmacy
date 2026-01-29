'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface EmailPreferences {
  user_id: string;
  opt_in_orders: boolean;
  opt_in_prescriptions: boolean;
  opt_in_promotions: boolean;
  opt_in_newsletter: boolean;
  updated_at: string;
}

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const response = await fetch('/api/patient/email-preferences', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load preferences');
      const data = await response.json();
      setPreferences(data.preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof Omit<EmailPreferences, 'user_id' | 'updated_at'>) => {
    if (!preferences) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in');
        return;
      }

      const updatedPrefs = {
        ...preferences,
        [key]: !preferences[key],
      };

      const response = await fetch('/api/patient/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          [key]: updatedPrefs[key],
        }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');

      setPreferences(updatedPrefs);
      setSuccess('Preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Preferences</h1>
          <p className="text-gray-600">Manage what emails you receive from us</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {preferences && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Order Confirmations */}
            <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Order Confirmations</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Receive emails when you place an order or your order status changes
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('opt_in_orders')}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      preferences.opt_in_orders ? 'bg-green-600' : 'bg-gray-300'
                    } ${isSaving ? 'opacity-50' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences.opt_in_orders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Prescription Updates */}
            <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Prescription Updates</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Receive emails about prescription refills, approvals, and status changes
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('opt_in_prescriptions')}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      preferences.opt_in_prescriptions ? 'bg-green-600' : 'bg-gray-300'
                    } ${isSaving ? 'opacity-50' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences.opt_in_prescriptions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Promotions */}
            <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Promotions & Sales</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Receive emails about special offers, discounts, and sales on products
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('opt_in_promotions')}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      preferences.opt_in_promotions ? 'bg-green-600' : 'bg-gray-300'
                    } ${isSaving ? 'opacity-50' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences.opt_in_promotions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Newsletter</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Receive our monthly newsletter with health tips, medication information, and wellness advice
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggle('opt_in_newsletter')}
                    disabled={isSaving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      preferences.opt_in_newsletter ? 'bg-green-600' : 'bg-gray-300'
                    } ${isSaving ? 'opacity-50' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        preferences.opt_in_newsletter ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notice</h3>
          <p className="text-sm text-blue-800">
            You will always receive critical emails about your prescriptions, orders, and account security regardless of your preferences.
            These preferences only apply to promotional and informational emails.
          </p>
        </div>
      </div>
    </div>
  );
}

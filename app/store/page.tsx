import React from 'react';
import { redirect } from 'next/navigation';
import { getOTCDrugs } from '@/app/actions/inventory';
import StoreClientComponent from './store-client';
import { createServerSupabaseClient, createServerAdminClient } from '@/lib/supabase-server';

export const metadata = {
  title: 'Store - RoyaltyMeds Pharmacy',
  description: 'Browse and purchase OTC medications',
};

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDoctorRole() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const adminClient = await createServerAdminClient();
    const { data: userData } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    
    return (userData as any)?.role || null;
  } catch (error) {
    return null;
  }
}

export default async function StorePage() {
  // Check if user is a doctor and redirect to dashboard
  const userRole = await getDoctorRole();
  if (userRole === "doctor") {
    redirect("/doctor/dashboard");
  }

  const drugs = await getOTCDrugs();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Header - Page Title */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">RoyaltyMeds Store</h1>
          <p className="text-gray-600 mt-1">Browse and purchase over-the-counter medications</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <StoreClientComponent drugs={drugs} />
      </div>
    </div>
  );
}

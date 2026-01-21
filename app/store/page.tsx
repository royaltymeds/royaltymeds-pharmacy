import React from 'react';
import { getOTCDrugs } from '@/app/actions/inventory';
import StoreClientComponent from './store-client';
import { StoreHeader } from './StoreHeader';

export const metadata = {
  title: 'Store - RoyaltyMeds Pharmacy',
  description: 'Browse and purchase OTC medications',
};

export default async function StorePage() {
  const drugs = await getOTCDrugs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <StoreHeader />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StoreClientComponent drugs={drugs} />
      </div>
    </div>
  );
}

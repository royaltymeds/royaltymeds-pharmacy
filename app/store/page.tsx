import React from 'react';
import { getOTCDrugs } from '@/app/actions/inventory';
import { ShoppingCart } from 'lucide-react';
import StoreClientComponent from './store-client';

export const metadata = {
  title: 'Store - RoyaltyMeds Pharmacy',
  description: 'Browse and purchase OTC medications',
};

export default async function StorePage() {
  const drugs = await getOTCDrugs();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">RoyaltyMeds Store</h1>
            </div>
            <a
              href="/cart"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Cart
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <StoreClientComponent drugs={drugs} />
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ShoppingCart, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';

export function StoreHeader() {
  const { itemCount } = useCart();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">RoyaltyMeds Store</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/patient/home"
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

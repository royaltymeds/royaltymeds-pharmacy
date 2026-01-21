'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';

export function CartButtonWithBadge() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="text-sm font-medium">View Cart</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';

export function MobileCartIconButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center p-2 text-green-100 hover:bg-green-700 rounded-md transition"
      aria-label="View cart"
    >
      <ShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

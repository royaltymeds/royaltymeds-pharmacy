'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';

export function CartBadge() {
  const { itemCount } = useCart();

  return (
    <Link href="/cart" className="relative inline-flex items-center">
      <ShoppingCart className="w-5 h-5 text-white hover:text-green-200 transition-colors" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

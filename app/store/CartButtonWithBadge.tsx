'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { AuthRequiredModal } from './AuthRequiredModal';
import { createClient } from '@/lib/supabase/client';

export function CartButtonWithBadge() {
  const { itemCount } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // If authenticated, navigate to cart
    window.location.href = '/cart';
  };

  return (
    <>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <button
        onClick={handleClick}
        className="relative inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
      >
        <ShoppingCart className="w-5 h-5" />
        <span className="text-sm font-medium">View Cart</span>
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    </>
  );
}

'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { AuthRequiredModal } from './AuthRequiredModal';
import { createClient } from '@/lib/supabase/client';

export function MobileCartIconButton() {
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
        className="relative inline-flex items-center p-2 text-green-100 hover:bg-green-700 rounded-md transition"
        aria-label="View cart"
      >
        <ShoppingCart className="w-5 h-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    </>
  );
}

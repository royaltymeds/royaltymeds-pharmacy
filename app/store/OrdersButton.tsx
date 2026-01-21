'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { AuthRequiredModal } from './AuthRequiredModal';
import { createClient } from '@/lib/supabase-browser';

interface OrdersButtonProps {
  onNavigate?: () => void;
}

export function OrdersButton({ onNavigate }: OrdersButtonProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // If authenticated, navigate to orders
    onNavigate?.();
    window.location.href = '/patient/orders';
  };

  return (
    <>
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <button
        onClick={handleClick}
        className="inline-flex items-center px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium text-green-100 hover:text-white hover:bg-green-700 transition gap-2"
      >
        <Package className="w-4 h-4" />
        Orders
      </button>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { OrdersButton } from './OrdersButton';

export function StoreMobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button - visible on lg below */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-md text-green-100 hover:bg-green-700 transition"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Overlay - semi-transparent background when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - slides from right */}
      <div
        className={`fixed top-16 right-0 bottom-0 w-64 bg-green-700 shadow-lg z-40 lg:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-green-100 hover:text-white hover:bg-green-600"
            >
              Home
            </Link>
            <div>
              <OrdersButton onNavigate={() => setIsOpen(false)} />
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

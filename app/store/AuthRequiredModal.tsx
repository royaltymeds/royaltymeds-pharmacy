'use client';

import Link from 'next/link';
import { X } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Sign In Required</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            To place an order, you need to be logged in. Please create an account or log in to your existing account.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <Link
              href="/login"
              onClick={onClose}
              className="w-full block text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className="w-full block text-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Sign Up
            </Link>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

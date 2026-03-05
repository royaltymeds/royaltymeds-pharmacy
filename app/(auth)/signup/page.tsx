import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, PhoneIcon, ClockIcon } from "lucide-react";

export const metadata = {
  title: "Sign Up - RoyaltyMeds",
  description: "Create your RoyaltyMeds account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/royaltymeds_logo.jpeg"
                alt="RoyaltyMeds Logo"
                fill
                className="object-contain"
              />
            </div>
            <Link href="/" className="text-lg sm:text-2xl font-bold text-gray-900 hover:text-green-600 transition">
              <span className="text-green-600">R</span>oyaltyMeds
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/#features"
              className="hidden md:block text-gray-700 hover:text-green-600 transition text-sm"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="hidden md:block text-gray-700 hover:text-green-600 transition text-sm"
            >
              How It Works
            </Link>
            <Link
              href="/store"
              className="px-3 sm:px-6 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-base"
            >
              Start Ordering
            </Link>
            <Link
              href="/login"
              className="px-3 sm:px-6 py-1.5 sm:py-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition font-semibold text-xs sm:text-base"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 font-medium text-sm">
          ← Back to Home
        </Link>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-600 text-sm">Join <span className="text-green-600 font-semibold">R</span><span className="font-semibold">oyaltyMeds</span> today</p>
          </div>

          <SignupForm />

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-xs text-gray-600">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-green-600 hover:text-green-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-green-600 hover:text-green-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div className="text-center">
              <span className="text-lg sm:text-xl font-bold text-white">
                <span className="text-green-400">R</span>oyaltyMeds
              </span>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Your trusted online pharmacy for prescriptions and OTC medications.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <Link href="/#features" className="hover:text-green-400 transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-green-400 transition">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/store" className="hover:text-green-400 transition">
                    Store
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Contact Us</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm flex flex-col items-center">
                <li className="flex items-center gap-2">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">Shop #8, 2 Auburn Terrace, Daytona Dr, Jamaica</span>
                </li>
                <li className="flex items-center gap-2 mt-2">
                  <PhoneIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <a href="tel:+18765723720" className="hover:text-green-400 transition text-xs">
                    +1 876-572-3720
                  </a>
                </li>
                <li className="flex items-center gap-2 mt-2">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs">24/7 Available</span>
                </li>
              </ul>
            </div>

            {/* Pharmacist Access */}
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">For Pharmacists</h4>
              <Link
                href="/portal-redirect?from=footer"
                className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-xs sm:text-sm"
              >
                Pharmacist Portal
              </Link>
              <p className="text-xs text-gray-400 mt-3 sm:mt-4">
                Licensed pharmacists only
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
            <p>
              &copy; 2026 RoyaltyMeds. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs">
              <a href="#" className="hover:text-green-400 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-400 transition">
                Terms of Service
              </a>
              <a href="#" className="hover:text-green-400 transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

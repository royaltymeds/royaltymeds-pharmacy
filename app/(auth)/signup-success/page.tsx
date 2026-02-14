import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export const metadata = {
  title: "Signup Successful - RoyaltyMeds",
  description: "Your RoyaltyMeds account has been created successfully",
};

export default function SignupSuccessPage() {
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
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Success!</h1>
              <p className="text-gray-600 mb-2">Your account has been created successfully</p>
              <p className="text-sm text-gray-500 mb-8">You can now log in with your credentials</p>
            </div>

            <Link
              href="/login"
              className="w-full block text-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Go to Login Page
            </Link>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a href="#" className="text-green-600 hover:text-green-700">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";
import Image from "next/image";

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
    </div>
  );
}

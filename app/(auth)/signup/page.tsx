import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export const metadata = {
  title: "Sign Up - RoyaltyMeds",
  description: "Create your RoyaltyMeds account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
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
    </div>
  );
}

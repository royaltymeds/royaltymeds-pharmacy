import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Sign In - RoyaltyMeds",
  description: "Sign in to your RoyaltyMeds account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 font-medium text-sm">
          ← Back to Home
        </Link>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your RoyaltyMeds account</p>
            <p className="text-xs text-gray-500 mt-2">For Customers & Doctors</p>
          </div>

          <LoginForm />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              By signing in, you agree to our{" "}
              <a href="#" className="text-green-600 hover:text-green-700">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

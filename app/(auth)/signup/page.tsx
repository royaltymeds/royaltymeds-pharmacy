import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up - RoyaltyMeds",
  description: "Create your RoyaltyMeds account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join RoyaltyMeds today</p>
          </div>

          <SignupForm />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-600">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

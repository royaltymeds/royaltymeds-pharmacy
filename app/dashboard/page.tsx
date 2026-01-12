import Link from "next/link";

export const metadata = {
  title: "Page Unavailable - RoyaltyMeds",
  description: "This page is unavailable",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Unavailable</h1>
          <p className="text-gray-600">
            This page is no longer available. Each user role has their own dedicated dashboard.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please navigate to your role-specific dashboard:
          </p>
          <ul className="text-left space-y-2 text-sm text-gray-700 mb-8">
            <li>• <strong>Customers:</strong> Customer Portal</li>
            <li>• <strong>Doctors:</strong> Doctor Dashboard</li>
            <li>• <strong>Pharmacists:</strong> Pharmacy Dashboard</li>
          </ul>
          <Link
            href="/"
            className="inline-block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

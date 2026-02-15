"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadIcon, ShoppingCartIcon, MessageSquareIcon, RefreshCwIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

interface DashboardData {
  user: any;
  profile: any;
  prescriptions: any[];
  pendingPrescriptions: any[];
  orders: any[];
  refills: any[];
}

export default function PatientDashboardClient({ initialData }: { initialData: DashboardData }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setIsRefreshing(false);
  };

  const { profile, prescriptions, pendingPrescriptions, orders } = initialData;

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
              Welcome, {profile?.full_name?.split(" ")[0] || "Customer"}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Manage your prescriptions and orders</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-green-600 hover:text-green-700 font-medium text-xs md:text-sm whitespace-nowrap px-3 py-2 rounded hover:bg-green-50 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link href="/" className="text-green-600 hover:text-green-700 font-medium text-xs md:text-sm whitespace-nowrap">
              ← Home
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{orders?.length || 0}</p>
              <div className="mt-4 space-y-2">
                {(() => {
                  const statusCounts: Record<string, number> = {};
                  orders?.forEach(order => {
                    statusCounts[order.status || 'unknown'] = (statusCounts[order.status || 'unknown'] || 0) + 1;
                  });
                  return Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm text-gray-600">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <ShoppingCartIcon className="h-12 w-12 text-blue-600 flex-shrink-0 opacity-50" />
          </div>
        </div>

        {/* Total Prescriptions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Prescriptions</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">{(prescriptions?.length || 0) + (pendingPrescriptions?.length || 0)}</p>
              <div className="mt-4 space-y-2">
                {(() => {
                  const statusCounts: Record<string, number> = {};
                  [...(prescriptions || []), ...(pendingPrescriptions || [])].forEach(prescription => {
                    statusCounts[prescription.status || 'unknown'] = (statusCounts[prescription.status || 'unknown'] || 0) + 1;
                  });
                  return Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm text-gray-600">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <UploadIcon className="h-12 w-12 text-green-600 flex-shrink-0 opacity-50" />
          </div>
        </div>

        {/* Unread Messages */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Unread Messages</p>
              <p className="text-4xl font-bold text-gray-900 mt-3">0</p>
              <p className="mt-4 text-sm text-gray-500">No unread messages</p>
              <Link href="/patient/messages" className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm">
                View Messages →
              </Link>
            </div>
            <MessageSquareIcon className="h-12 w-12 text-purple-600 flex-shrink-0 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Link
            href="/patient/prescriptions"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Upload Prescription
          </Link>

          <Link
            href="/patient/orders"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            View Orders
          </Link>

          <Link
            href="/patient/prescriptions"
            className="bg-green-50 text-green-600 hover:bg-green-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Request Refill
          </Link>

          <Link
            href="/patient/messages"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg p-3 md:p-4 text-center text-sm md:text-base font-medium transition cursor-pointer"
          >
            Messages
          </Link>
        </div>
      </div>

      {/* Recent Prescriptions & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Prescriptions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Prescriptions</h2>
          {(prescriptions && prescriptions.length > 0) || (pendingPrescriptions && pendingPrescriptions.length > 0) ? (
            <div className="space-y-3">
              {[...prescriptions, ...pendingPrescriptions]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {prescription.medication_name || "Prescription"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      prescription.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : prescription.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {prescription.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No prescriptions yet.{" "}
              <Link href="/patient/prescriptions" className="text-green-600 hover:underline font-medium">
                Upload one
              </Link>
            </p>
          )}
          <Link
            href="/patient/prescriptions"
            className="block mt-4 text-center text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)
                .map((order) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(order.total_amount || 0)}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-800 capitalize">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              No orders yet. Start by{" "}
              <Link href="/patient/prescriptions" className="text-green-600 hover:underline font-medium">
                uploading a prescription
              </Link>
              .
            </p>
          )}
          <Link
            href="/patient/orders"
            className="block mt-4 text-center text-green-600 hover:text-green-700 font-medium text-sm"
          >
            View All →
          </Link>
        </div>
      </div>
    </div>
  );
}

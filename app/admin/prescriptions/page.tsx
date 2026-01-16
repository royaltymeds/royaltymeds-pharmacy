"use client";

import Link from "next/link";
import { CheckCircle, X, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const response = await fetch("/api/admin/prescriptions", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch prescriptions");
        }

        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } catch (error) {
        console.error("Error loading prescriptions:", error);
        setPrescriptions([]);
      }
    };

    loadPrescriptions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Review and approve patient prescriptions</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-green-600 hover:text-green-700 font-medium text-sm whitespace-nowrap"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Prescription ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prescriptions && prescriptions.length > 0 ? (
                (prescriptions as any[]).map((rx) => (
                  <tr key={rx.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {rx.id.slice(0, 8)}...
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {(rx.user_profiles as any)?.full_name || "Unknown"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                          rx.status
                        )}`}
                      >
                        {getStatusIcon(rx.status)}
                        <span className="hidden sm:inline">{rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {new Date(rx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm space-x-1 sm:space-x-2">
                      <Link
                        href={`/admin/prescriptions/${rx.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                      >
                        View
                      </Link>
                      {rx.status === "pending" && (
                        <>
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <button className="text-green-600 hover:text-green-700 font-medium text-xs hidden sm:inline">
                            Approve
                          </button>
                          <span className="text-gray-300 hidden sm:inline">|</span>
                          <button className="text-red-600 hover:text-red-700 font-medium text-xs hidden sm:inline">
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-xs sm:text-sm text-gray-600">
                    No prescriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {prescriptions && prescriptions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600 mt-1 sm:mt-2">
              {(prescriptions as any[]).filter((p) => p.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Approved</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
              {(prescriptions as any[]).filter((p) => p.status === "approved").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 sm:col-span-1 col-span-2">
            <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
            <p className="text-xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
              {(prescriptions as any[]).filter((p) => p.status === "rejected").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

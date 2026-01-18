import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, X, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Refill {
  id: string;
  patient_id: string;
  prescription_id: string;
  status: string;
  created_at: string;
}

async function getRefills(): Promise<Refill[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("refills")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching refills:", error);
    return [];
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <AlertCircle className="w-4 h-4" />;
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "rejected":
      return <X className="w-4 h-4" />;
    default:
      return null;
  }
}

export default async function AdminRefills() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch refills
  const refills = await getRefills();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Refill Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Approve or reject medication refill requests</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Refills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Refill ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Medication
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                  Requested
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {refills && refills.length > 0 ? (
                (refills as any[]).map((refill) => (
                  <tr key={refill.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {refill.id.slice(0, 8)}...
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {refill.users?.user_profiles?.full_name || "Unknown"}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                      {refill.prescriptions?.medication_name || "Unknown"}
                      <span className="text-xs text-gray-500 ml-2">
                        {refill.prescriptions?.dosage || ""}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                          refill.status
                        )}`}
                      >
                        {getStatusIcon(refill.status)}
                        <span className="hidden sm:inline">{refill.status.charAt(0).toUpperCase() + refill.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                      {new Date(refill.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm space-x-1 sm:space-x-2">
                      <Link
                        href={`/admin/refills/${refill.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
                      >
                        View
                      </Link>
                      {refill.status === "pending" && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm">
                            Approve
                          </button>
                          <span className="text-gray-300">|</span>
                          <button className="text-red-600 hover:text-red-700 font-medium text-xs sm:text-sm">
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-gray-600">
                    No refill requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      {refills && refills.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Pending</p>
            <p className="text-lg sm:text-3xl font-bold text-yellow-600 mt-2">
              {(refills as any[]).filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600">Completed</p>
            <p className="text-lg sm:text-3xl font-bold text-green-600 mt-2">
              {(refills as any[]).filter((r) => r.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
            <p className="text-lg sm:text-3xl font-bold text-red-600 mt-2">
              {(refills as any[]).filter((r) => r.status === "rejected").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

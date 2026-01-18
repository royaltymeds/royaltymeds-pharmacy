import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, X, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  status: string;
  created_at: string;
}

async function getPrescriptions(): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }
}

function getStatusColor(status: string) {
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
}

function getStatusIcon(status: string) {
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
}

export default async function AdminPrescriptions() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch prescriptions
  const prescriptions = await getPrescriptions();

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Review and approve patient prescriptions</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap"
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
                  Prescription #
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
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 font-mono">
                      {rx.prescription_number}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {(rx.users as any)?.user_profiles?.full_name || "Unknown"}
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

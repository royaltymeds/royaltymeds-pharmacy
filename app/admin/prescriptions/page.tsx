import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, X, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

interface Prescription {
  id: string;
  prescription_number: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  status: string;
  created_at: string;
  source: "patient" | "doctor";
}

async function getPrescriptions(): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Create admin client for unrestricted access
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch prescriptions from patient prescriptions table
    const { data: patientPrescriptions = [] } = await supabaseAdmin
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch prescriptions from doctor prescriptions table
    const { data: doctorPrescriptions = [] } = await supabaseAdmin
      .from("doctor_prescriptions")
      .select("*")
      .order("created_at", { ascending: false });

    // Combine and mark source
    const allPrescriptions = [
      ...(patientPrescriptions || []).map((p: any) => ({ ...p, source: "patient" as const })),
      ...(doctorPrescriptions || []).map((p: any) => ({ ...p, source: "doctor" as const })),
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return allPrescriptions;
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
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "partially_filled":
      return "bg-orange-100 text-orange-800";
    case "filled":
      return "bg-green-100 text-green-800";
    case "refill_requested":
      return "bg-purple-100 text-purple-800";
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
    case "processing":
      return <AlertCircle className="w-4 h-4" />;
    case "partially_filled":
      return <AlertCircle className="w-4 h-4" />;
    case "filled":
      return <CheckCircle className="w-4 h-4" />;
    case "refill_requested":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPrescriptions({ searchParams }: Props) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all prescriptions
  const allPrescriptions = await getPrescriptions();

  // Pagination
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1"));
  const totalPages = Math.ceil(allPrescriptions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const prescriptions = allPrescriptions.slice(startIndex, endIndex);

  // Validate page number
  const validPage = Math.min(currentPage, Math.max(1, totalPages));

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 md:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Prescription Management</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">Review and approve prescriptions {allPrescriptions.length > 0 && <span className="text-gray-500">({allPrescriptions.length})</span>}</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
        {allPrescriptions.length > 0 ? (
          <>
            {/* Top Pagination Controls */}
            {totalPages > 1 && (
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {validPage} of {totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`?page=${validPage - 1}`}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      validPage === 1
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Link>
                  
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`?page=${page}`}
                        className={`px-2 sm:px-3 py-2 rounded text-xs font-medium transition ${
                          page === validPage
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={`?page=${validPage + 1}`}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      validPage === totalPages
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Prescriptions List */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {prescriptions.map((rx) => (
                <div key={`${rx.source}-${rx.id}`} className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition">
                  <div className="flex flex-col gap-3">
                    {/* First row: Number and Status */}
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm font-mono">
                            Rx #{rx.prescription_number}
                          </p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            rx.source === "patient" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {rx.source === "patient" ? "Patient" : "Doctor"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(
                          rx.status
                        )}`}
                      >
                        {getStatusIcon(rx.status)}
                        <span>{rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}</span>
                      </span>
                    </div>

                    {/* Second row: Medication and Date */}
                    {rx.medication_name && (
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Medication:</span> {rx.medication_name}
                      </div>
                    )}

                    {/* Third row: Date and Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {new Date(rx.created_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/admin/prescriptions/${rx.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-xs whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {validPage} of {totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`?page=${validPage - 1}`}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      validPage === 1
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Link>
                  
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`?page=${page}`}
                        className={`px-2 sm:px-3 py-2 rounded text-xs font-medium transition ${
                          page === validPage
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </Link>
                    ))}
                  </div>

                  <Link
                    href={`?page=${validPage + 1}`}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      validPage === totalPages
                        ? "bg-gray-100 text-gray-400 pointer-events-none"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p className="text-sm">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}

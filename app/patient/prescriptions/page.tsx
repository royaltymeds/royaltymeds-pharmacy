import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PrescriptionsUploadForm } from "@/components/PrescriptionsUploadForm";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  medication_name: string;
  status: string;
  created_at: string;
  file_url?: string;
}

const ITEMS_PER_PAGE = 10;

async function getPrescriptions(userId: string): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }
}

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PrescriptionsPage({ searchParams }: Props) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch prescriptions
  const allPrescriptions = await getPrescriptions(user.id);

  // Pagination logic
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
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-2">
          Upload new prescriptions or view your existing prescriptions
        </p>
      </div>

      {/* Upload Form (Client Component) */}
      <PrescriptionsUploadForm />

      {/* View Prescriptions (Server-rendered) */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
          Your Prescriptions {allPrescriptions.length > 0 && <span className="text-gray-500 text-sm font-normal">({allPrescriptions.length})</span>}
        </h3>
        
        {allPrescriptions.length > 0 ? (
          <>
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {rx.medication_name || "Prescription"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(rx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        rx.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : rx.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {rx.status?.charAt(0).toUpperCase() + rx.status?.slice(1)}
                    </span>
                  </div>
                  {rx.file_url && (
                    <Link
                      href={rx.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 sm:mt-3 text-xs text-blue-600 hover:underline"
                    >
                      View File →
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {validPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`?page=${validPage - 1}`}
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                      validPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    onClick={(e) => validPage === 1 && e.preventDefault()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Link>
                  
                  <div className="flex gap-1 items-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`?page=${page}`}
                        className={`px-2.5 sm:px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
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
                    className={`flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition ${
                      validPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                    onClick={(e) => validPage === totalPages && e.preventDefault()}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 py-6 sm:py-8 text-sm">
            No prescriptions found.
          </p>
        )}
      </div>
    </div>
  );
}

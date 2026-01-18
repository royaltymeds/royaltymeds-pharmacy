import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RefreshCwIcon, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Refill {
  id: string;
  prescription_id: string;
  status: string;
  created_at: string;
  prescription?: { medication_name: string };
}

async function getRefills(userId: string): Promise<Refill[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("refills")
      .select("*")
      .eq("patient_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  } catch (error) {
    console.error("Error fetching refills:", error);
    return [];
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "denied":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function RefillsPage() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch refills
  const refills = await getRefills(user.id);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Refill Requests</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-2">Manage your medication refills</p>
      </div>

      {/* Request New Refill Button */}
      <Link
        href="/patient/refills/request"
        className="inline-block px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-xs sm:text-sm md:text-base"
      >
        Request New Refill
      </Link>

      {/* Refills List */}
      {refills && refills.length > 0 ? (
        <div className="space-y-2 sm:space-y-3 md:space-y-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 md:gap-4 auto-rows-max">
          {refills.map((refill) => (
            <div key={refill.id} className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-t-4 border-green-500 h-full">
              <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <RefreshCwIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {refill.prescription?.medication_name || "Medication"}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Refill #{refill.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600">
                    <div>
                      <p className="text-xs font-medium">Requested</p>
                      <p className="font-medium text-gray-900 mt-1 text-xs">
                        {new Date(refill.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap flex-shrink-0 ${getStatusColor(
                    refill.status
                  )}`}
                >
                  {refill.status}
                </span>
              </div>

              {refill.status === "denied" && (
                <div className="mt-3 sm:mt-4 bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-700">
                    This refill request was denied. Please contact support for more details.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12 text-center">
          <RefreshCwIcon className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2">No Refill Requests</h3>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6">
            You don&apos;t have any pending refill requests. Create a new one when you need a refill.
          </p>
          <Link
            href="/patient/refills/request"
            className="inline-block px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-xs sm:text-sm md:text-base"
          >
            Request a Refill
          </Link>
        </div>
      )}
    </div>
  );
}

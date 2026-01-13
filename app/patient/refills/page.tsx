import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import { RefreshCwIcon, AlertCircle } from "lucide-react";

export default async function RefillsPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  // Middleware already protects this route, so we don't need to check auth here
  // Just fetch the user to get their ID for queries
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null; // Should never happen due to middleware protection

  // Fetch refill requests
  const { data: refillsData } = await supabase
    .from("refills")
    .select(
      `
      id,
      status,
      refill_number,
      requested_at,
      processed_at,
      prescriptions(
        id,
        medication_name,
        dosage,
        quantity,
        refills_allowed
      )
    `
    )
    .eq("patient_id", user.id)
    .order("requested_at", { ascending: false });

  const refills = (refillsData as any) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
        <h1 className="text-3xl font-bold text-gray-900">Refill Requests</h1>
        <p className="text-gray-600 mt-2">Manage your medication refills</p>
      </div>

      {/* Request New Refill Button */}
      <Link
        href="/patient/refills/request"
        className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
      >
        Request New Refill
      </Link>

      {/* Refills List */}
      {refills && refills.length > 0 ? (
        <div className="space-y-4">
          {refills.map((refill: any) => (
            <div key={refill.id} className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-green-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <RefreshCwIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {refill.prescriptions?.medication_name || "Medication"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Refill #{refill.refill_number}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="text-xs font-medium">Dosage</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {refill.prescriptions?.dosage || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Quantity</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {refill.prescriptions?.quantity || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Refills Allowed</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {refill.prescriptions?.refills_allowed || "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Requested</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {new Date(refill.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${getStatusColor(
                    refill.status
                  )}`}
                >
                  {refill.status}
                </span>
              </div>

              {refill.status === "rejected" && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">
                    This refill request was rejected. Please contact support for more details.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <RefreshCwIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Refill Requests</h3>
          <p className="text-gray-600 mb-6">
            You don&apos;t have any pending refill requests. Create a new one when you need a refill.
          </p>
          <Link
            href="/patient/refills/request"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Request a Refill
          </Link>
        </div>
      )}
    </div>
  );
}

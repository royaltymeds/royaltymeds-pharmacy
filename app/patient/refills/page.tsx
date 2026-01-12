import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, RefreshCwIcon, AlertCircle } from "lucide-react";

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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/patient/home"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Refill Requests</h1>
          <p className="text-gray-600 mt-2">Manage your medication refills</p>
        </div>

        {/* Request New Refill Button */}
        <div className="mb-8">
          <Link
            href="/patient/refills/request"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Request New Refill
          </Link>
        </div>

        {/* Refills List */}
        {refills && refills.length > 0 ? (
          <div className="space-y-4">
            {refills.map((refill: any) => (
              <div key={refill.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <RefreshCwIcon className="w-5 h-5 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {refill.prescriptions?.medication_name || "Medication"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Refill #{refill.refill_number}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs">Dosage</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {refill.prescriptions?.dosage || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Quantity</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {refill.prescriptions?.quantity || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Refills Allowed</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {refill.prescriptions?.refills_allowed || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs">Requested</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {new Date(refill.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ml-4 ${getStatusColor(
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
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <RefreshCwIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Refill Requests</h3>
            <p className="text-gray-600 mb-6">
              You don&apos;t have any pending refill requests. Create a new one when you need a refill.
            </p>
            <Link
              href="/patient/refills/request"
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Request a Refill
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

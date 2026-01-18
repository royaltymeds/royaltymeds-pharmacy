import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PrescriptionsUploadForm } from "@/components/PrescriptionsUploadForm";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  medication_name: string;
  status: string;
  created_at: string;
  file_url?: string;
}

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

export default async function PrescriptionsPage() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch prescriptions
  const prescriptions = await getPrescriptions(user.id);



  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-600">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Upload new prescriptions or view your existing prescriptions
        </p>
      </div>

      {/* Upload Form (Client Component) */}
      <PrescriptionsUploadForm />

      {/* View Prescriptions (Server-rendered) */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Prescriptions</h3>
        
        {prescriptions.length > 0 ? (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {rx.medication_name || "Prescription"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
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
                    className="inline-block mt-3 text-xs text-blue-600 hover:underline"
                  >
                    View File →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">
            No prescriptions found.
          </p>
        )}
      </div>
    </div>
  );
}

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PatientLinksClient from "./PatientLinksClient";

export const dynamic = "force-dynamic";

export default async function PatientLinks() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border-l-4 border-blue-600">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Patient Links</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
          Link patients to doctors for prescription management
        </p>
      </div>

      <PatientLinksClient />
    </div>
  );
}

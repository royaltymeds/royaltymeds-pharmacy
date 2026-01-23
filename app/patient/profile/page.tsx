import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PatientProfileClient from "@/app/patient/profile/patient-profile-client";

export const dynamic = "force-dynamic";

async function getPatientProfile(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch user profile with all details
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    return profileData;
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return null;
  }
}

export default async function PatientProfilePage() {
  // Auth check - page-level enforcement
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getPatientProfile(user.id);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-green-600">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
          View and manage your profile information
        </p>
      </div>

      {/* Profile Content */}
      <PatientProfileClient profile={profile} userId={user.id} userEmail={user.email || ""} />
    </div>
  );
}

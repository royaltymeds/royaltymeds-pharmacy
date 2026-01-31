import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import MyPrescriptionsClient from "./MyPrescriptionsClient";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  patient_id: string;
  duration: string;
  instructions: string | null;
  notes: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  prescription_number: string;
  created_at: string;
}

async function getPrescriptions(doctorId: string): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    console.log("[Doctor My-Prescriptions] Fetching doctor prescriptions for doctor_id:", doctorId);
    
    const { data, error } = await supabase
      .from("doctor_prescriptions")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    
    console.log("[Doctor My-Prescriptions] Query result:", { data, error });
    
    if (error) {
      console.error("[Doctor My-Prescriptions] Query error:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return [];
  }
}

export default async function MyPrescriptions() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("[Doctor My-Prescriptions] Current user:", user?.id, user?.email);
  
  if (!user) redirect("/login");

  // Fetch prescriptions
  const prescriptions = await getPrescriptions(user.id);
  
  console.log("[Doctor My-Prescriptions] Prescriptions fetched:", prescriptions.length);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-l-4 border-blue-600">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 sm:mt-2">
          Track and manage all prescriptions submitted to the pharmacy
        </p>
      </div>

      <MyPrescriptionsClient initialPrescriptions={prescriptions} />
    </div>
  );
}

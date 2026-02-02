import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import MyPrescriptionsClient from "./MyPrescriptionsClient";

export const dynamic = "force-dynamic";

interface Prescription {
  id: string;
  patient_id: string;
  patient_name?: string;
  duration: string;
  instructions: string | null;
  notes: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  prescription_number: string;
  created_at: string;
  pharmacist_name: string | null;
  filled_at: string | null;
}

async function getPrescriptions(doctorId: string): Promise<Prescription[]> {
  try {
    const supabase = await createServerSupabaseClient();
    console.log("[getPrescriptions] Starting - doctor_id:", doctorId);
    
    // Query doctor_prescriptions with patient profile info
    const { data, error } = await supabase
      .from("doctor_prescriptions")
      .select(`
        *,
        users:patient_id(
          user_profiles(
            full_name
          )
        )
      `)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false });
    
    console.log("[getPrescriptions] Raw query result:", { 
      dataCount: data?.length,
      dataKeys: data?.[0] ? Object.keys(data[0]) : [],
      firstRecord: data?.[0],
      error 
    });
    
    if (error) {
      console.error("[getPrescriptions] Query error:", error);
      return [];
    }
    
    // Transform data to match interface
    const transformed = (data || []).map((item: any) => ({
      id: item.id,
      patient_id: item.patient_id,
      patient_name: item.users?.user_profiles?.full_name || "Unknown",
      duration: item.duration,
      instructions: item.instructions,
      notes: item.notes,
      status: item.status,
      file_url: item.file_url,
      file_name: item.file_name,
      prescription_number: item.prescription_number,
      created_at: item.created_at,
      pharmacist_name: item.pharmacist_name,
      filled_at: item.filled_at,
    }));
    
    console.log("[getPrescriptions] Transformed data:", { count: transformed.length, items: transformed });
    
    return transformed;
  } catch (error) {
    console.error("[getPrescriptions] Exception:", error);
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

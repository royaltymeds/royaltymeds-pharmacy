import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PatientsClient from "./PatientsClient";

export const dynamic = "force-dynamic";

interface Patient {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  prescriptionCount: number;
}

async function getPatients(doctorId: string): Promise<Patient[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("doctor_patients")
      .select("patient_id")
      .eq("doctor_id", doctorId);

    if (!data || data.length === 0) return [];

    const patientIds = data.map((dp) => dp.patient_id);
    const { data: patients } = await supabase
      .from("users")
      .select("id, email, name, phone")
      .in("id", patientIds);

    // Get prescription counts
    const { data: prescriptions } = await supabase
      .from("prescriptions")
      .select("patient_id");

    const prescriptionCounts = prescriptions?.reduce(
      (acc, p) => {
        acc[p.patient_id] = (acc[p.patient_id] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

    return (
      patients?.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name || "",
        phone: p.phone,
        prescriptionCount: prescriptionCounts[p.id] || 0,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
}

export default async function Patients() {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch patients
  const patients = await getPatients(user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border-l-4 border-blue-600">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Your Patients</h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          View patients for prescription submission
        </p>
      </div>

      <PatientsClient initialPatients={patients} />
    </div>
  );
}

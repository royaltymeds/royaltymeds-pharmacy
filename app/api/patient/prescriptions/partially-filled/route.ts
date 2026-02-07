import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch partially filled prescriptions from both sources
    const [patientData, doctorData] = await Promise.all([
      supabase
        .from("prescriptions")
        .select("id, prescription_number, medication_name, status, file_url")
        .eq("patient_id", user.id)
        .eq("status", "partially_filled"),
      supabase
        .from("doctor_prescriptions")
        .select("id, prescription_number, medication_name, status, file_url")
        .eq("patient_id", user.id)
        .eq("status", "partially_filled"),
    ]);

    // Combine results with source information
    const patientPrescriptions = (patientData.data || []).map((p: any) => ({
      ...p,
      source: "patient" as const,
    }));

    const doctorPrescriptions = (doctorData.data || []).map((p: any) => ({
      ...p,
      source: "doctor" as const,
    }));

    const prescriptions = [...patientPrescriptions, ...doctorPrescriptions];

    return NextResponse.json({
      prescriptions,
    });
  } catch (error) {
    console.error("[GET /api/patient/prescriptions/partially-filled]", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

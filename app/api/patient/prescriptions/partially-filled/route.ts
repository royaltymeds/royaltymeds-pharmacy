import { createClient } from "@supabase/supabase-js";
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

    // console.log("[API] Fetching partially-filled prescriptions for user:", user.id);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch partially filled prescriptions from both sources
    const [patientData, doctorData] = await Promise.all([
      supabaseAdmin
        .from("prescriptions")
        .select("id, prescription_number, status, file_url")
        .eq("patient_id", user.id)
        .eq("status", "partially_filled"),
      supabaseAdmin
        .from("doctor_prescriptions")
        .select("id, prescription_number, medication_name, status, file_url")
        .eq("patient_id", user.id)
        .eq("status", "partially_filled"),
    ]);

    // console.log("[API] Patient prescriptions result:", {
    //   count: patientData.data?.length || 0,
    //   error: patientData.error?.message,
    // });

    // console.log("[API] Doctor prescriptions result:", {
    //   count: doctorData.data?.length || 0,
    //   error: doctorData.error?.message,
    // });

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

    // console.log("[API] Total prescriptions returned:", prescriptions.length);

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

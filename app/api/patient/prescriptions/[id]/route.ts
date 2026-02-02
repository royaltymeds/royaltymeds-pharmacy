import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // First try to fetch from patient prescriptions
    const { data: patientPrescription } = await supabase
      .from("prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        created_at,
        updated_at,
        file_url,
        prescription_number,
        doctor_name,
        doctor_phone,
        doctor_email,
        practice_name,
        practice_address,
        filled_at,
        pharmacist_name,
        is_refillable,
        refill_limit,
        refill_count,
        last_refilled_at,
        prescription_items(
          id,
          medication_name,
          dosage,
          quantity,
          total_amount,
          notes
        )
      `
      )
      .eq("id", id)
      .eq("patient_id", user.id)
      .single();

    if (patientPrescription) {
      return NextResponse.json({ prescription: { ...patientPrescription, source: "patient" } });
    }

    // If not found in patient prescriptions, try doctor prescriptions
    const { data: doctorPrescription } = await supabase
      .from("doctor_prescriptions")
      .select(
        `
        id,
        status,
        patient_id,
        doctor_id,
        created_at,
        updated_at,
        file_url,
        prescription_number,
        doctor_name,
        doctor_phone,
        doctor_email,
        practice_name,
        practice_address,
        filled_at,
        pharmacist_name,
        is_refillable,
        refill_limit,
        refill_count,
        last_refilled_at,
        doctor_prescriptions_items(
          id,
          medication_name,
          dosage,
          quantity,
          total_amount,
          notes
        )
      `
      )
      .eq("id", id)
      .eq("patient_id", user.id)
      .single();

    if (doctorPrescription) {
      return NextResponse.json({ 
        prescription: { 
          ...doctorPrescription, 
          prescription_items: doctorPrescription.doctor_prescriptions_items || [],
          source: "doctor" 
        } 
      });
    }

    return NextResponse.json(
      { error: "Prescription not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

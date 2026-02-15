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
    const { id } = await params;
    console.log("API: Fetching prescription:", { id });

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log("API: Auth header present:", !!authHeader);

    if (!token) {
      console.log("API: No token provided");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    console.log("API: User from token:", user?.id);

    if (!user) {
      console.log("API: User verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First try to fetch from patient prescriptions
    const { data: patientPrescription, error: patientError } = await supabase
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
          price,
          total_amount,
          notes
        )
      `
      )
      .eq("id", id)
      .eq("patient_id", user.id)
      .single();

    console.log("API: Patient prescription result:", { found: !!patientPrescription, error: patientError?.message });

    if (patientPrescription) {
      return NextResponse.json({ prescription: { ...patientPrescription, source: "patient" } });
    }

    // If not found in patient prescriptions, try doctor prescriptions
    const { data: doctorPrescription, error: doctorError } = await supabase
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
          price,
          total_amount,
          notes
        )
      `
      )
      .eq("id", id)
      .eq("patient_id", user.id)
      .single();

    console.log("API: Doctor prescription result:", { found: !!doctorPrescription, error: doctorError?.message });

    if (doctorPrescription) {
      return NextResponse.json({ 
        prescription: { 
          ...doctorPrescription, 
          prescription_items: doctorPrescription.doctor_prescriptions_items || [],
          source: "doctor" 
        } 
      });
    }

    console.log("API: Prescription not found for user:", user.id);
    return NextResponse.json(
      { error: "Prescription not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("API: Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

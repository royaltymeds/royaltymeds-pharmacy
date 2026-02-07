import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/patient/prescriptions/[id]/request-refill
// Patient requests a refill of an existing prescription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: prescriptionId } = await params;
  const body = await request.json();
  const source = body.source || "patient";

  try {
    const supabase = createClientForApi(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determine which table to query based on source
    const tableName = source === "doctor" ? "doctor_prescriptions" : "prescriptions";

    // Get the prescription to verify patient owns it and it's in partially_filled status
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from(tableName)
      .select("id, patient_id, status")
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Verify patient owns this prescription
    if (prescription.patient_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: This is not your prescription" },
        { status: 403 }
      );
    }

    // Check if prescription is in partially_filled status
    if (prescription.status !== "partially_filled") {
      return NextResponse.json(
        {
          error: "Refill can only be requested for prescriptions in partially_filled status",
        },
        { status: 400 }
      );
    }

    // Check if there's already a refill request pending
    if (prescription.status === "refill_requested") {
      return NextResponse.json(
        { error: "A refill request is already pending for this prescription" },
        { status: 400 }
      );
    }

    // Update prescription status to refill_requested
    const { data: updatedPrescription, error: updateError } = await supabaseAdmin
      .from(tableName)
      .update({
        status: "refill_requested",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating prescription status:", updateError);
      return NextResponse.json(
        { error: "Failed to request refill" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Refill request submitted",
        prescription: updatedPrescription,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error requesting prescription refill:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

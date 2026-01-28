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

    const body = await request.json();
    const { reason = "Refill requested" } = body;

    // Get the prescription to verify patient owns it
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .select("id, patient_id, refill_count, refill_limit, status")
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

    // Check if prescription is refillable
    if (prescription.refill_count >= prescription.refill_limit) {
      return NextResponse.json(
        {
          error: "No refills remaining for this prescription",
          refillsUsed: prescription.refill_count,
          refillLimit: prescription.refill_limit,
        },
        { status: 400 }
      );
    }

    // Check if there's already a pending refill request
    const { data: existingRequest } = await supabaseAdmin
      .from("refill_requests")
      .select("id")
      .eq("prescription_id", prescriptionId)
      .eq("patient_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending refill request for this prescription" },
        { status: 400 }
      );
    }

    // Create refill request
    const { data: refillRequest, error: refillError } = await supabaseAdmin
      .from("refill_requests")
      .insert({
        prescription_id: prescriptionId,
        patient_id: user.id,
        reason,
        status: "pending",
      })
      .select()
      .single();

    if (refillError) {
      console.error("Error creating refill request:", refillError);
      return NextResponse.json(
        { error: "Failed to request refill" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Refill request submitted",
        refillRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error requesting prescription refill:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

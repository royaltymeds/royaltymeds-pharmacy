import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/admin/prescriptions/[id]/process-refill
// Pharmacist processes an approved refill by creating a new prescription
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

    // Verify user is admin using service role
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { items } = body;

    // Get original prescription
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .select(
        `
        id,
        patient_id,
        doctor_id,
        prescription_number,
        medication_name,
        refill_count,
        refill_limit,
        prescription_items(
          id,
          medication_name,
          dosage,
          quantity,
          total_amount
        )
      `
      )
      .eq("id", prescriptionId)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Check refill eligibility
    if (prescription.refill_count >= prescription.refill_limit) {
      return NextResponse.json(
        {
          error: "No refills remaining",
          refillsUsed: prescription.refill_count,
          refillLimit: prescription.refill_limit,
        },
        { status: 400 }
      );
    }

    // Update prescription refill count and status
    const { error: updateError } = await supabaseAdmin
      .from("prescriptions")
      .update({
        refill_count: prescription.refill_count + 1,
        last_refilled_at: new Date().toISOString(),
        status: "processing",
        refill_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    if (updateError) throw updateError;

    // If items provided, reset their quantities for the new refill
    if (items && items.length > 0) {
      for (const item of items) {
        await supabaseAdmin
          .from("prescription_items")
          .update({
            quantity_filled: 0,
            quantity: item.quantity || prescription.prescription_items[0]?.quantity,
          })
          .eq("id", item.itemId);
      }
    }

    // Update refill request to "fulfilled"
    const { error: refillError } = await supabaseAdmin
      .from("refill_requests")
      .update({
        status: "fulfilled",
        updated_at: new Date().toISOString(),
      })
      .eq("prescription_id", prescriptionId)
      .eq("status", "approved");

    if (refillError) {
      console.error("Error updating refill request:", refillError);
      // Don't fail the response, refill was processed
    }

    return NextResponse.json({
      success: true,
      message: "Prescription refilled successfully",
      refillCount: prescription.refill_count + 1,
      refillsRemaining: prescription.refill_limit - (prescription.refill_count + 1),
    });
  } catch (error: any) {
    console.error("Error processing refill:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

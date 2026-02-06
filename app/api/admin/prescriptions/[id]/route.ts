import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, table, source, patient_id } = await request.json();

    // Validate that at least status or patient_id is provided
    if (!status && !patient_id) {
      return NextResponse.json(
        { error: "Either status or patient_id is required" },
        { status: 400 }
      );
    }

    if (status && !["approved", "rejected", "processing", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved', 'rejected', 'processing', or 'pending'" },
        { status: 400 }
      );
    }

    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determine which table to update based on the source or table parameter (source takes precedence)
    const tableName = (source === "doctor" || table === "doctor") ? "doctor_prescriptions" : "prescriptions";

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    if (patient_id) {
      updateData.patient_id = patient_id;
    }

    // Update the prescription
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[UPDATE_PRESCRIPTION] Error:", error);
      return NextResponse.json(
        { error: `Failed to update prescription: ${error.message}` },
        { status: 400 }
      );
    }

    const message = patient_id 
      ? "Patient linked successfully" 
      : `Prescription ${status} successfully`;

    return NextResponse.json({
      success: true,
      message,
      prescription: data,
    });
  } catch (error) {
    console.error("[UPDATE_PRESCRIPTION] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

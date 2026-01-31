import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, table, source } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "processing", "pending"].includes(status)) {
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

    // Update the prescription status
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[UPDATE_PRESCRIPTION_STATUS] Error:", error);
      return NextResponse.json(
        { error: `Failed to update prescription: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Prescription ${status} successfully`,
      prescription: data,
    });
  } catch (error) {
    console.error("[UPDATE_PRESCRIPTION_STATUS] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, table } = await request.json();

    if (!status || !table) {
      return NextResponse.json(
        { error: "Status and table are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "processing"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved', 'rejected', or 'processing'" },
        { status: 400 }
      );
    }

    // Create an admin client that bypasses RLS using service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determine which table to update based on the source
    const tableName = table === "patient" ? "prescriptions" : "doctor_prescriptions";

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

import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClientForApi(request);
    const { id } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify prescription belongs to doctor and is pending
    const { data: prescription } = await supabase
      .from("doctor_prescriptions")
      .select("*")
      .eq("id", id)
      .eq("doctor_id", user.id)
      .eq("status", "pending")
      .single();

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found or cannot be deleted" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("doctor_prescriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Prescription deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // console.log("[GET /api/doctor/prescriptions/[id]] Fetching items for prescription:", id);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch medication items for this prescription
    const { data: items, error } = await supabaseAdmin
      .from("doctor_prescriptions_items")
      .select("*")
      .eq("doctor_prescription_id", id);

// console.log("[GET /api/doctor/prescriptions/[id]] Query result:", {
    //   itemsCount: items?.length,
    //   items,
    //   error
    // });

    if (error) throw error;

    return NextResponse.json(
      { items: items || [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching medication items:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

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

import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/admin/refill-requests
// Get all refill requests with filtering and pagination
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from("refill_requests")
      .select(
        `
        id,
        prescription_id,
        prescriptions(
          id,
          prescription_number,
          status,
          medication_name,
          patient_id,
          refill_count,
          refill_limit
        ),
        patient_id,
        requested_at,
        approved_at,
        approved_by,
        status,
        reason,
        notes
      `,
        { count: "exact" }
      )
      .order("requested_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: refillRequests, count, error } = await query
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return NextResponse.json({
      data: refillRequests || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: any) {
    console.error("Error fetching refill requests:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/refill-requests/[id]
// Approve or reject a refill request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: refillRequestId } = await params;

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
    const { status, notes } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Get the refill request
    const { data: refillRequest, error: fetchError } = await supabaseAdmin
      .from("refill_requests")
      .select("id, status, prescription_id")
      .eq("id", refillRequestId)
      .single();

    if (fetchError || !refillRequest) {
      return NextResponse.json(
        { error: "Refill request not found" },
        { status: 404 }
      );
    }

    // Update refill request with approval/rejection
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("refill_requests")
      .update({
        status: status === "approved" ? "approved" : "rejected",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        notes,
      })
      .eq("id", refillRequestId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If approved, increment refill count in prescriptions table
    if (status === "approved") {
      const { error: prescriptionError } = await supabaseAdmin
        .from("prescriptions")
        .update({ refill_status: "refill_pending" })
        .eq("id", refillRequest.prescription_id);

      if (prescriptionError) {
        console.error("Error updating prescription refill status:", prescriptionError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Refill request ${status} successfully`,
      refillRequest: updated,
    });
  } catch (error: any) {
    console.error("Error updating refill request:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

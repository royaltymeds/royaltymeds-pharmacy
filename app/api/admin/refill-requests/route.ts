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

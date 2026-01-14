import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

/**
 * GET /api/patient/orders
 * Fetch orders for authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Fetch patient's orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patient/orders
 * Create new order from prescription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);
    const body = await request.json();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.prescription_id) {
      return NextResponse.json(
        { error: "Prescription ID is required" },
        { status: 400 }
      );
    }

    // Verify prescription belongs to user
    const { data: prescription, error: prescError } = await supabase
      .from("prescriptions")
      .select("id")
      .eq("id", body.prescription_id)
      .eq("patient_id", user.id)
      .single();

    if (prescError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Create order
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        patient_id: user.id,
        prescription_id: body.prescription_id,
        status: "pending",
        payment_status: "pending",
        delivery_type: body.delivery_type || "delivery",
        delivery_address: body.delivery_address || null,
        delivery_city: body.delivery_city || null,
        delivery_state: body.delivery_state || null,
        delivery_zip: body.delivery_zip || null,
        total_amount: body.total_amount || 0,
        currency: "USD",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

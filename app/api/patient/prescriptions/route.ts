import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/patient/prescriptions
 * Fetch prescriptions for authenticated patient
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Use anon key for client-side requests
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Fetch patient's prescriptions
    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("Prescription fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/patient/prescriptions
 * Create new prescription (file upload handled by client)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // Validate required fields
    if (!body.file_url) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    // Create prescription
    const { data: prescription, error } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: user.id,
        file_url: body.file_url,
        medication_name: body.medication_name || null,
        dosage: body.dosage || null,
        quantity: body.quantity ? parseInt(body.quantity) : null,
        notes: body.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (error) {
    console.error("Prescription creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

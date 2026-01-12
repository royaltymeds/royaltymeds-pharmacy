import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(_request.url);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("doctor_prescriptions")
      .select(
        `
        id,
        patient_id,
        medication_name,
        dosage,
        quantity,
        frequency,
        duration,
        instructions,
        notes,
        status,
        created_at,
        users(name, email)
      `
      )
      .eq("doctor_id", user.id);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    const formattedData = data?.map((prescription: any) => ({
      id: prescription.id,
      patientId: prescription.patient_id,
      patientName: prescription.users?.name || "Unknown",
      patientEmail: prescription.users?.email || "Unknown",
      medicationName: prescription.medication_name,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions,
      notes: prescription.notes,
      status: prescription.status,
      createdAt: prescription.created_at,
    })) || [];

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            console.error("Cookie error:", error);
          }
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { error } = await supabase.from("doctor_prescriptions").insert([
      {
        doctor_id: user.id,
        patient_id: body.patientId,
        medication_name: body.medicationName,
        dosage: body.dosage,
        quantity: body.quantity,
        frequency: body.frequency,
        duration: body.duration,
        instructions: body.instructions || null,
        notes: body.notes || null,
        status: "pending",
      },
    ]);

    if (error) throw error;

    return NextResponse.json(
      { message: "Prescription submitted successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting prescription:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientForApi(request);

    // Refresh session to get valid auth context on Netlify
    await supabase.auth.getSession();

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
    const url = new URL(request.url);
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
        created_at
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
  try {
    const supabase = createClientForApi(request);
    const body = await request.json();

    // Refresh session to get valid auth context on Netlify
    await supabase.auth.getSession();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

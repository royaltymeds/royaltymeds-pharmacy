import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Use service role to bypass RLS and see all data
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all doctor_prescriptions
    const { data: allPrescriptions, error: allError } = await adminClient
      .from("doctor_prescriptions")
      .select("*");

    console.log("[Debug] All doctor_prescriptions in DB:", {
      count: allPrescriptions?.length,
      data: allPrescriptions,
      error: allError,
    });

    // Get all users with doctor role
    const { data: doctors, error: doctorsError } = await adminClient
      .from("users")
      .select("id, email, role")
      .eq("role", "doctor");

    console.log("[Debug] All doctors in users table:", {
      count: doctors?.length,
      data: doctors,
      error: doctorsError,
    });

    return NextResponse.json({
      allPrescriptions: { count: allPrescriptions?.length, data: allPrescriptions, error: allError },
      doctors: { count: doctors?.length, data: doctors, error: doctorsError },
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

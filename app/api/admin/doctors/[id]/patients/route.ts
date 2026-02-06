import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;

    const supabase = createClientForApi(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create service role client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if current user is admin
    const { data: currentUser } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view patient links" },
        { status: 403 }
      );
    }

    // Get all patients linked to this doctor
    const { data: links, error: linksError } = await adminClient
      .from("doctor_patient_links")
      .select("patient_id")
      .eq("doctor_id", doctorId);

    if (linksError) {
      console.error("[admin/doctors/[id]/patients] Error fetching links:", linksError);
      return NextResponse.json({ error: linksError.message }, { status: 400 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    const patientIds = links.map((l: any) => l.patient_id);

    // Fetch patient user records
    const { data: patients, error: patientsError } = await adminClient
      .from("users")
      .select("id, email")
      .in("id", patientIds);

    if (patientsError) {
      console.error("[admin/doctors/[id]/patients] Error fetching users:", patientsError);
      return NextResponse.json({ error: patientsError.message }, { status: 400 });
    }

    // Fetch patient profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name")
      .in("user_id", patientIds);

    if (profilesError) {
      console.error("[admin/doctors/[id]/patients] Error fetching profiles:", profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 400 });
    }

    // Build patients list with profile info
    const patientsList = (patients || []).map((patient: any) => {
      const profile = (profiles || []).find((p: any) => p.user_id === patient.id);
      return {
        id: patient.id,
        email: patient.email,
        fullName: profile?.full_name || "Unknown",
      };
    });

    return NextResponse.json({ patients: patientsList });
  } catch (error) {
    console.error("[admin/doctors/[id]/patients] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

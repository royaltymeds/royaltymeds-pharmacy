import { createClient } from "@supabase/supabase-js";
import { createClientForApi } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET - List all patient-doctor links
export async function GET(request: NextRequest) {
  try {
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

    // Get all patient-doctor links
    const { data: links, error } = await adminClient
      .from("doctor_patient_links")
      .select("patient_id, doctor_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/patient-links] Error fetching links:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ links: [] });
    }

    // Get unique patient and doctor IDs
    const patientIds = [...new Set((links || []).map((l: any) => l.patient_id))];
    const doctorIds = [...new Set((links || []).map((l: any) => l.doctor_id))];

    // Fetch patient and doctor user records
    const [{ data: patients }, { data: doctors }] = await Promise.all([
      adminClient
        .from("users")
        .select("id, email")
        .in("id", patientIds),
      adminClient
        .from("users")
        .select("id, email")
        .in("id", doctorIds),
    ]);

    // Fetch patient and doctor profiles
    const [{ data: patientProfiles }, { data: doctorProfiles }] = await Promise.all([
      adminClient
        .from("user_profiles")
        .select("user_id, full_name, phone, street_address_line_1, street_address_line_2, city, state, postal_code, country, date_of_birth")
        .in("user_id", patientIds),
      adminClient
        .from("user_profiles")
        .select("user_id, full_name")
        .in("user_id", doctorIds),
    ]);

    // Build maps for quick lookup
    const patientMap = new Map();
    (patients || []).forEach((p: any) => {
      const profile = (patientProfiles || []).find(
        (pr: any) => pr.user_id === p.id
      );
      // Format address from structured fields
      const addressParts = [];
      if (profile?.street_address_line_1) addressParts.push(profile.street_address_line_1);
      if (profile?.street_address_line_2) addressParts.push(profile.street_address_line_2);
      if (profile?.city) addressParts.push(profile.city);
      if (profile?.state) addressParts.push(profile.state);
      if (profile?.postal_code) addressParts.push(profile.postal_code);
      if (profile?.country) addressParts.push(profile.country);
      const address = addressParts.length > 0 ? addressParts.join(", ") : null;

      patientMap.set(p.id, {
        id: p.id,
        email: p.email,
        fullName: profile?.full_name || "Unknown",
        phone: profile?.phone || null,
        address: address,
        dateOfBirth: profile?.date_of_birth || null,
      });
    });

    const doctorMap = new Map();
    (doctors || []).forEach((d: any) => {
      const profile = (doctorProfiles || []).find(
        (pr: any) => pr.user_id === d.id
      );
      doctorMap.set(d.id, {
        id: d.id,
        email: d.email,
        fullName: profile?.full_name || "Unknown",
      });
    });

    // Format links with patient and doctor details
    const formattedLinks = (links || []).map((link: any) => ({
      patientId: link.patient_id,
      doctorId: link.doctor_id,
      patient: patientMap.get(link.patient_id),
      doctor: doctorMap.get(link.doctor_id),
    }));

    return NextResponse.json({ links: formattedLinks });
  } catch (error) {
    console.error("[admin/patient-links] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Link patient to doctor
export async function POST(request: NextRequest) {
  try {
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
        { error: "Only admins can link patients" },
        { status: 403 }
      );
    }

    const { patientId, doctorId } = await request.json();

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: "patientId and doctorId are required" },
        { status: 400 }
      );
    }

    // Check if link already exists
    const { data: existingLink } = await adminClient
      .from("doctor_patient_links")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .single();

    if (existingLink) {
      return NextResponse.json(
        { error: "Patient is already linked to this doctor" },
        { status: 409 }
      );
    }

    // Create the link
    const { error: linkError } = await adminClient
      .from("doctor_patient_links")
      .insert({
        doctor_id: doctorId,
        patient_id: patientId,
      });

    if (linkError) {
      console.error("[admin/patient-links] Error linking patient:", linkError);
      return NextResponse.json({ error: linkError.message }, { status: 400 });
    }

    // Fetch the created link with full details
    const { data: patientData } = await adminClient
      .from("users")
      .select("id, email")
      .eq("id", patientId)
      .single();

    const { data: doctorData } = await adminClient
      .from("users")
      .select("id, email")
      .eq("id", doctorId)
      .single();

    const { data: patientProfile } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name, phone, street_address_line_1, street_address_line_2, city, state, postal_code, country, date_of_birth")
      .eq("user_id", patientId)
      .single();

    const { data: doctorProfile } = await adminClient
      .from("user_profiles")
      .select("user_id, full_name")
      .eq("user_id", doctorId)
      .single();

    // Format address from structured fields
    const addressParts = [];
    if (patientProfile?.street_address_line_1) addressParts.push(patientProfile.street_address_line_1);
    if (patientProfile?.street_address_line_2) addressParts.push(patientProfile.street_address_line_2);
    if (patientProfile?.city) addressParts.push(patientProfile.city);
    if (patientProfile?.state) addressParts.push(patientProfile.state);
    if (patientProfile?.postal_code) addressParts.push(patientProfile.postal_code);
    if (patientProfile?.country) addressParts.push(patientProfile.country);
    const address = addressParts.length > 0 ? addressParts.join(", ") : null;

    const link = {
      patientId,
      doctorId,
      patient: {
        id: patientData?.id,
        email: patientData?.email,
        fullName: patientProfile?.full_name || "Unknown",
        phone: patientProfile?.phone || null,
        address: address,
        dateOfBirth: patientProfile?.date_of_birth || null,
      },
      doctor: {
        id: doctorData?.id,
        email: doctorData?.email,
        fullName: doctorProfile?.full_name || "Unknown",
      },
    };

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("[admin/patient-links] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Unlink patient from doctor
export async function DELETE(request: NextRequest) {
  try {
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
        { error: "Only admins can unlink patients" },
        { status: 403 }
      );
    }

    const { patientId, doctorId } = await request.json();

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { error: "patientId and doctorId are required" },
        { status: 400 }
      );
    }

    const { error } = await adminClient
      .from("doctor_patient_links")
      .delete()
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId);

    if (error) {
      console.error("[admin/patient-links] Error unlinking patient:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/patient-links] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

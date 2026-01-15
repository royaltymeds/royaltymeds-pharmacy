import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

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

    // Get query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let query = supabase
      .from("users")
      .select("id, email, user_profiles(full_name, phone)")
      .eq("role", "patient");  // Only fetch patients, not doctors or admins

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,user_profiles.full_name.ilike.%${search}%`
      );
    }

    const { data: patients, error } = await query;

    if (error) throw error;

    return NextResponse.json(
      patients?.map((patient: any) => ({
        id: patient.id,
        email: patient.email,
        name: patient.user_profiles?.[0]?.full_name || "Unknown",
        phone: patient.user_profiles?.[0]?.phone || null,
      })) || []
    );
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

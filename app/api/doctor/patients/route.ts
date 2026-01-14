import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

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
      .select("id, name, email, phone");

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,name.ilike.%${search}%`
      );
    }

    const { data: patients, error } = await query;

    if (error) throw error;

    // For each patient, count their prescriptions
    const patientsWithCounts = await Promise.all(
      (patients || []).map(async (patient: any) => {
        const { count } = await supabase
          .from("doctor_prescriptions")
          .select("*", { count: "exact", head: true })
          .eq("doctor_id", user.id)
          .eq("patient_id", patient.id);

        return {
          ...patient,
          prescriptionCount: count || 0,
        };
      })
    );

    return NextResponse.json(patientsWithCounts);
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

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

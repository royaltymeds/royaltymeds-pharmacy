import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prescriptionId = id;
  const body = await request.json();
  const { admin_notes, doctor_name, doctor_phone, doctor_email, practice_name, practice_address } = body;

  try {
    // Verify user is authenticated and is admin
    const cookieStore = await cookies();
    const supabase = createServerClient(URL, ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle errors silently
          }
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: No user found" }),
        { status: 401 }
      );
    }

    // Use service role client for database operations and admin verification
    const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);

    // Check if user is admin using service role to bypass RLS
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (doctor_name !== undefined) updateData.doctor_name = doctor_name;
    if (doctor_phone !== undefined) updateData.doctor_phone = doctor_phone;
    if (doctor_email !== undefined) updateData.doctor_email = doctor_email;
    if (practice_name !== undefined) updateData.practice_name = practice_name;
    if (practice_address !== undefined) updateData.practice_address = practice_address;

    if (Object.keys(updateData).length === 0) {
      return new Response(
        JSON.stringify({ error: "No fields to update" }),
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("prescriptions")
      .update(updateData)
      .eq("id", prescriptionId)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to update prescription" }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ data, success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating prescription details:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

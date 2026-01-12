import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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

    // Verify user is authenticated and is admin
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

    // Check if current user is admin
    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view admin users" },
        { status: 403 }
      );
    }

    // Get all admin users
    const { data: admins, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        created_at,
        user_profiles(full_name)
      `
      )
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const formattedAdmins = (admins || []).map((admin: any) => ({
      id: admin.id,
      email: admin.email,
      fullName: admin.user_profiles?.[0]?.full_name || "Unknown",
      createdAt: admin.created_at,
    }));

    return NextResponse.json(formattedAdmins);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

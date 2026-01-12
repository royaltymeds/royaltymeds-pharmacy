import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create authenticated client for the current user
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

    // Verify current user is admin
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
        { error: "Only admins can create admin accounts" },
        { status: 403 }
      );
    }

    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    // Create admin service client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create auth user
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json(
        { error: createError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user record in public.users
    const { error: userError } = await adminClient
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email,
          role: "admin",
          is_active: true,
        },
      ]);

    if (userError) {
      // Delete the auth user if we fail to create the profile
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create admin user record" },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await adminClient
      .from("user_profiles")
      .insert([
        {
          user_id: authData.user.id,
          full_name: fullName,
        },
      ]);

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: {
          id: authData.user.id,
          email,
          fullName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

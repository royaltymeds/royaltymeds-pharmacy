import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    
    // Use server client with cookie management to properly set session cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          },
        },
      }
    );

    // Exchange code for session (this will set cookies via the server client)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.user?.id) {
      // Redirect to login if code exchange fails
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Get the user's role from the users table
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    // Redirect based on user role
    if (userData?.role === "patient") {
      return NextResponse.redirect(new URL("/patient/home", request.url));
    } else if (userData?.role === "doctor") {
      return NextResponse.redirect(new URL("/doctor/dashboard", request.url));
    } else if (userData?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Default redirect to login if no code or role found
  return NextResponse.redirect(new URL("/login", request.url));
}

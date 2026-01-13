import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.user?.id) {
      return NextResponse.redirect(new URL("/login?error=auth", request.url));
    }

    // Ensure user profile exists in users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", data.user.id)
      .single();

    // Get user's role
    const userRole = existingUser?.role || "patient";

    // Redirect based on role
    let redirectUrl = "/patient/home";
    if (userRole === "doctor") {
      redirectUrl = "/doctor/dashboard";
    } else if (userRole === "admin") {
      redirectUrl = "/admin/dashboard";
    }

    // Return redirect - cookies are set by the server client
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=nocode", request.url));
}

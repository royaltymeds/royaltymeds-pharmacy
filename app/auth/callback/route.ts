import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Create response early so we can set cookies on it
    let response = NextResponse.redirect(new URL("/auth/success", request.url));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as CookieOptions);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !data.user?.id) {
      console.error("Auth exchange failed:", error);
      return NextResponse.redirect(new URL("/login?error=auth", request.url));
    }

    // Use service role client to bypass RLS for role lookup
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure user profile exists in users table
    const { data: existingUser, error: userError } = await serviceRoleClient
      .from("users")
      .select("id, role")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      console.error("Error fetching user role:", userError);
    }

    // Get user's role - default to patient if not found
    const userRole = existingUser?.role || "patient";
    console.log("User authenticated with role:", userRole, "User ID:", data.user.id);

    // Update response redirect with role
    response = NextResponse.redirect(new URL(`/auth/success?role=${userRole}`, request.url));
    
    // Re-apply cookies to new response
    data.session?.access_token && response.cookies.set("sb-access-token", data.session.access_token);
    data.session?.refresh_token && response.cookies.set("sb-refresh-token", data.session.refresh_token);

    console.log("Redirecting to auth/success with role:", userRole);
    return response;
  }

  return NextResponse.redirect(new URL("/login?error=nocode", request.url));
}

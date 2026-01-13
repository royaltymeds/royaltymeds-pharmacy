import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { generateAuthorizationToken, formatAuthorizationHeader } from "@/lib/auth-header-session";

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

    // Generate an authorization token for header-based authentication
    // This works reliably across Netlify's serverless functions
    const authSession = generateAuthorizationToken(data.user.id);

    // Get the user's role from the users table
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    // Determine redirect URL based on role
    let redirectUrl = "/";
    if (userData?.role === "patient") {
      redirectUrl = "/patient/home";
    } else if (userData?.role === "doctor") {
      redirectUrl = "/doctor/dashboard";
    } else if (userData?.role === "admin") {
      redirectUrl = "/admin/dashboard";
    }

    // Redirect with authorization token in query param
    // Client will extract and store in localStorage
    const response = NextResponse.redirect(
      new URL(`${redirectUrl}?auth_token=${encodeURIComponent(authSession.token)}`, request.url)
    );

    // Also set token as Authorization header on response for immediate access
    response.headers.set("Authorization", formatAuthorizationHeader(authSession.token));
    
    return response;
  }

  // Default redirect to login if no code or role found
  return NextResponse.redirect(new URL("/login", request.url));
}

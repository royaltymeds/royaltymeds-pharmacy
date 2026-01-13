import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createBlobSession } from "@/lib/netlify-blob-session";

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

    // Create a Netlify Blobs session token for Netlify compatibility
    // Blobs persists across serverless function invocations (unlike cookies)
    const sessionData = await createBlobSession(
      data.user.id,
      data.session?.access_token,
      data.session?.refresh_token
    );
    if (sessionData) {
      const response = NextResponse.redirect(new URL("/", request.url));
      // Store the session token in a cookie for easy access
      response.cookies.set("session_token", sessionData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/",
      });
      return response;
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

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { validateSessionToken } from "@/lib/session-store";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create Supabase server client with cookie-based auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );

  // Refresh session if exists
  let {
    data: { session },
  } = await supabase.auth.getSession();

  // Fallback: Check for database session token if cookie-based auth failed
  // This is critical for Netlify where cookies don't persist across function invocations
  if (!session) {
    const sessionToken = req.cookies.get("session_token")?.value;
    if (sessionToken) {
      const userId = await validateSessionToken(sessionToken);
      if (userId) {
        // We have a valid session token, but couldn't restore cookie-based session
        // Set a flag in response headers to indicate this
        response.headers.set("X-Session-Token-Valid", "true");
        response.headers.set("X-User-ID", userId);
      }
    }
  }

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") && req.nextUrl.pathname !== "/admin-login";
  const isProtectedRoute = [
    "/dashboard",
    "/profile",
    "/patient",
    "/doctor",
    "/admin",
  ].some((route) => req.nextUrl.pathname.startsWith(route)) &&
    req.nextUrl.pathname !== "/admin-login";

  // Check if user is authenticated either via cookie session or database session token
  const isAuthenticated = !!session || response.headers.get("X-Session-Token-Valid") === "true";

  // Redirect to admin-login if accessing admin routes without session
  if (!isAuthenticated && isAdminRoute) {
    const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
    adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(adminLoginUrl);
  }

  // Redirect to login if accessing other protected routes without session
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated user tries to access /admin routes, verify they are admin
  if (isAuthenticated && (isAdminRoute || req.nextUrl.pathname === "/admin-login")) {
    try {
      // Use session user ID or fallback to header-provided user ID
      const userId = session?.user?.id || response.headers.get("X-User-ID");
      if (!userId) {
        const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
        adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
        return NextResponse.redirect(adminLoginUrl);
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      // If user is not admin (regardless of error), redirect to admin-login
      if (error || userData?.role !== "admin") {
        const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
        adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
        return NextResponse.redirect(adminLoginUrl);
      }
    } catch (error) {
      // If we can't fetch user role, redirect to admin-login to be safe
      // This prevents any errors from bubbling up to the user
      const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
      adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (isAuthenticated && (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return response;
}

export const config = {
  matcher: [
    "/(auth.*)",
    "/(patient.*)",
    "/(doctor.*)",
    "/(admin.*)",
    "/dashboard/:path*",
    "/profile/:path*",
  ],
};

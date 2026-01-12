import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/signup") ||
    req.nextUrl.pathname === "/admin-login";
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") && req.nextUrl.pathname !== "/admin-login";
  const isProtectedRoute = [
    "/dashboard",
    "/profile",
    "/patient",
    "/doctor",
    "/admin",
  ].some((route) => req.nextUrl.pathname.startsWith(route)) &&
    req.nextUrl.pathname !== "/admin-login";

  // Redirect to admin-login if accessing admin routes without session
  if (!session && isAdminRoute) {
    const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
    adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(adminLoginUrl);
  }

  // Redirect to login if accessing other protected routes without session
  if (!session && isProtectedRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
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

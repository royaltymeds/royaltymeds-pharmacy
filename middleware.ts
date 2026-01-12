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

  // If authenticated user tries to access /admin routes, verify they are admin
  if (session && (isAdminRoute || req.nextUrl.pathname === "/admin-login")) {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();

      // If user is not admin, redirect to admin-login
      if (userData?.role !== "admin") {
        const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
        adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
        return NextResponse.redirect(adminLoginUrl);
      }
    } catch (error) {
      // If we can't fetch user role, redirect to admin-login to be safe
      const adminLoginUrl = new URL("/admin-login", req.nextUrl.origin);
      adminLoginUrl.searchParams.set("next", req.nextUrl.pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (session && (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup"))) {
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

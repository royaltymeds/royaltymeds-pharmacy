import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Check if user has auth token
  const authToken = req.cookies.get("sb-auth-token");
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/signup");
  const isProtectedRoute = [
    "/dashboard",
    "/profile",
    "/patient",
    "/doctor",
    "/admin",
  ].some((route) => req.nextUrl.pathname.startsWith(route));

  // Redirect to login if accessing protected routes without auth
  if (!authToken && isProtectedRoute) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (authToken && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
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

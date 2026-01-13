import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options as CookieOptions);
              });
            } catch (error) {
              console.error("Error setting cookies in middleware:", error);
            }
          },
        },
      }
    );

    // Refresh session - this ensures auth.users cookies stay valid
    await supabase.auth.getSession();
  } catch (error) {
    // Gracefully handle errors when there's no request context (e.g., during build)
    // This is normal during static generation and doesn't affect runtime behavior
    console.debug("Middleware session refresh skipped (no request context)");
  }

  return response;
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
    "/profile/:path*",
  ],
};

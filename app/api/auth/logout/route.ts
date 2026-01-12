import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function handleLogout(req: NextRequest) {
  const cookieStore = await cookies();

  // Create Supabase server client to sign out
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

  // Sign out the user (this clears the auth session)
  await supabase.auth.signOut();

  // Explicitly clear all auth-related cookies
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.includes("auth") || cookie.name.includes("sb")) {
      cookieStore.delete(cookie.name);
    }
  });

  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  });
}

export async function GET(req: NextRequest) {
  return handleLogout(req);
}

export async function POST(req: NextRequest) {
  return handleLogout(req);
}

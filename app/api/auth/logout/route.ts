import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function handleLogout(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.auth.signOut();

  // Clear auth cookie
  const cookieStore = await cookies();
  cookieStore.delete("sb-auth-token");

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

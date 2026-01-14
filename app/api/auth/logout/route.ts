import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

async function handleLogout(req: NextRequest) {
  const supabase = createClientForApi(req);

  // Sign out the user (this clears the auth session)
  await supabase.auth.signOut();

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

import { NextRequest, NextResponse } from "next/server";
import { createClientForApi } from "@/lib/supabase-server";

async function handleLogout(req: NextRequest) {
  console.log("[Logout API] Logout called");
  const supabase = createClientForApi(req);

  // Sign out the user (this clears the auth session)
  const { error } = await supabase.auth.signOut();
  console.log("[Logout API] signOut result - error:", error?.message);

  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  });
}

export async function GET(req: NextRequest) {
  console.log("[Logout API] GET request");
  return handleLogout(req);
}

export async function POST(req: NextRequest) {
  console.log("[Logout API] POST request");
  return handleLogout(req);
}

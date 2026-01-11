import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Get the user's role from the users table
    if (data?.user?.id) {
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
  }

  // Default redirect to dashboard if no role found
  return NextResponse.redirect(new URL("/dashboard", request.url));
}

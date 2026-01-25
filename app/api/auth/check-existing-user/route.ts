import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { email, phone } = await request.json();

    console.log("[check-existing-user API] Checking for existing user:", { email, phone });

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const duplicates = {
      emailExists: false,
      phoneExists: false,
      existingUserName: null,
    };

    // Check if email exists in user_profiles
    if (email) {
      const { data: profilesByEmail, error: emailError } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, full_name")
        .ilike("email", email)
        .limit(1);

      if (emailError && !emailError.message.includes("does not exist")) {
        console.error("[check-existing-user API] Email check error:", emailError);
      }

      if (profilesByEmail && profilesByEmail.length > 0) {
        duplicates.emailExists = true;
        duplicates.existingUserName = profilesByEmail[0].full_name;
        console.log("[check-existing-user API] Email already exists");
      }
    }

    // Check if phone exists in user_profiles
    if (phone && !duplicates.emailExists) {
      const { data: profilesByPhone, error: phoneError } = await supabaseAdmin
        .from("user_profiles")
        .select("user_id, full_name")
        .eq("phone", phone)
        .limit(1);

      if (phoneError && !phoneError.message.includes("does not exist")) {
        console.error("[check-existing-user API] Phone check error:", phoneError);
      }

      if (profilesByPhone && profilesByPhone.length > 0) {
        duplicates.phoneExists = true;
        duplicates.existingUserName = profilesByPhone[0].full_name;
        console.log("[check-existing-user API] Phone already exists");
      }
    }

    return NextResponse.json({
      exists: duplicates.emailExists || duplicates.phoneExists,
      ...duplicates,
    });
  } catch (error) {
    console.error("[check-existing-user API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

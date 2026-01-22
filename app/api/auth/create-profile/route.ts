import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Prevent this route from being executed at build time
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Create a service role client for creating profiles (only at request time)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const { userId, fullName, email, role, phone, address, dateOfBirth } = await request.json();

    console.log("[create-profile API] Request received:", { userId, fullName, email, role, phone, address, dateOfBirth });

    if (!userId || !fullName) {
      console.warn("[create-profile API] Missing required fields");
      return NextResponse.json(
        { error: "Missing userId or fullName" },
        { status: 400 }
      );
    }

    // First, create the user in public.users table (if it doesn't exist)
    console.log("[create-profile API] Creating user in public.users:", userId);
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: userId,
          email: email || "unknown@example.com",
          role: role || "patient",
          is_active: true,
        },
      ]);

    if (userError) {
      // Ignore duplicate key errors, fail on others
      if (!userError.message.includes("duplicate") && !userError.message.includes("violates unique constraint")) {
        console.error("[create-profile API] User creation error:", userError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 400 }
        );
      }
      console.log("[create-profile API] User already exists (duplicate key), continuing");
    } else {
      console.log("[create-profile API] User created successfully");
    }

    // Then create the profile
    console.log("[create-profile API] Creating profile:", { userId, fullName, phone, address, dateOfBirth });
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert([
        {
          user_id: userId,
          full_name: fullName,
          phone: phone || null,
          address: address || null,
          date_of_birth: dateOfBirth || null,
        },
      ]);

    if (profileError) {
      console.error("[create-profile API] Profile creation error:", profileError);
      return NextResponse.json(
        { error: profileError.message || "Failed to create profile" },
        { status: 400 }
      );
    }

    console.log("[create-profile API] Profile created successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[create-profile API] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

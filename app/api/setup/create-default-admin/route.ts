import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const DEFAULT_ADMIN_ID = "550e8400-e29b-41d4-a716-446655440000";
const DEFAULT_ADMIN_EMAIL = "royaltymedsadmin@royaltymeds.com";
const DEFAULT_ADMIN_PASSWORD = "Options123$";

export async function POST() {
  try {
    // Create admin client
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if auth user already exists
    const { data: existingAuthUser } = await adminClient.auth.admin.getUserById(
      DEFAULT_ADMIN_ID
    );

    if (existingAuthUser?.user) {
      return NextResponse.json(
        {
          success: true,
          message: "Default admin account already exists",
          admin: {
            email: DEFAULT_ADMIN_EMAIL,
            id: DEFAULT_ADMIN_ID,
          },
        },
        { status: 200 }
      );
    }

    // Create auth user with specific ID
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        admin: true,
      },
    });

    if (createAuthError) {
      return NextResponse.json(
        { error: createAuthError.message || "Failed to create auth user" },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: "Failed to create auth user" },
        { status: 500 }
      );
    }

    // Verify the user was created with the expected ID (Supabase generates its own ID)
    // If the ID is different, we need to update our database records
    const actualId = authData.user.id;

    if (actualId !== DEFAULT_ADMIN_ID) {
      // Update the user record to use the actual ID from auth
      await adminClient
        .from("users")
        .delete()
        .eq("id", DEFAULT_ADMIN_ID);

      await adminClient
        .from("users")
        .update({ id: actualId })
        .eq("id", DEFAULT_ADMIN_ID);

      await adminClient
        .from("user_profiles")
        .delete()
        .eq("user_id", DEFAULT_ADMIN_ID);

      await adminClient
        .from("user_profiles")
        .update({ user_id: actualId })
        .eq("user_id", DEFAULT_ADMIN_ID);

      return NextResponse.json(
        {
          success: true,
          message: "Default admin account created with different ID",
          admin: {
            email: DEFAULT_ADMIN_EMAIL,
            id: actualId,
            password: DEFAULT_ADMIN_PASSWORD,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Default admin account created successfully",
        admin: {
          email: DEFAULT_ADMIN_EMAIL,
          id: DEFAULT_ADMIN_ID,
          password: DEFAULT_ADMIN_PASSWORD,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}

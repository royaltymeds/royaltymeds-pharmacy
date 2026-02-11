import { createClient } from "@supabase/supabase-js";

// Create an admin client that can bypass RLS and create users directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create an auth user directly using the admin API
export async function createAuthUser(email: string, password: string) {
  try {
    // console.log("[createAuthUser] Creating user with email:", email);
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (error) {
      console.error("[createAuthUser] Error creating user:", error);
      throw error;
    }

    // console.log("[createAuthUser] User created successfully:", data.user?.id);
    return data.user;
  } catch (err) {
    console.error("[createAuthUser] Unexpected error:", err);
    throw err;
  }
}

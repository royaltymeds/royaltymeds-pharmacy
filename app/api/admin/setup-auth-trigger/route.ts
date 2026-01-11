import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Execute the trigger creation SQL directly
    const triggerSQL = `
      -- Create trigger to sync auth.users with public.users table
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.users (id, email, role, is_active)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE((NEW.raw_user_meta_data->>'role'), 'patient'),
          true
        )
        ON CONFLICT (id) DO UPDATE
        SET email = NEW.email;
        
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `;

    // Execute using Postgres
    const { error } = await supabaseAdmin.rpc("execute_sql", {
      sql: triggerSQL,
    });

    if (error) {
      console.error("Trigger creation error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create trigger" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

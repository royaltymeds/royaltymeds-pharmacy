import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  let cookieStore;
  
  try {
    cookieStore = await cookies();
  } catch (error) {
    // Fallback for environments where cookies aren't accessible (e.g., StackBlitz in some contexts)
    console.warn("Warning: cookies() unavailable, using fallback");
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for fallback
          },
        },
      }
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            // Handle setAll errors in middleware context
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createServerSupabaseClient();
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function getUserWithRole() {
  const supabase = await createServerSupabaseClient();
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Get user role from database
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      ...user,
      role: userData?.role,
    };
  } catch (error) {
    console.error("Error getting user with role:", error);
    return null;
  }
}

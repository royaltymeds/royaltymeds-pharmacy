import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createServerSupabaseClient() {
  // Try to get cookies, but always continue
  let cookieStore: any = null;
  
  try {
    cookieStore = await cookies();
  } catch (error) {
    // In some async contexts (like prerendering), cookies() might fail
    // We'll use an empty fallback and rely on client-side auth
    // This is expected during static generation and not an error
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (!cookieStore) {
            return [];
          }
          try {
            return cookieStore.getAll();
          } catch (e) {
            return [];
          }
        },
        setAll(cookiesToSet) {
          if (!cookieStore) {
            return;
          }
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options as CookieOptions);
            });
          } catch (error) {
            // Silently fail - cookies might not be writable in all contexts
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

/**
 * Create a Supabase client for use in API route handlers
 * Extracts cookies from the request object (no await needed)
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const supabase = createClientForApi(request);
 *   const { data: { user } } = await supabase.auth.getUser();
 * }
 */
export function createClientForApi(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // Cookies are managed by middleware response
        },
        remove(_name: string, _options: CookieOptions) {
          // Cookies are managed by middleware response
        },
      },
    }
  );
}

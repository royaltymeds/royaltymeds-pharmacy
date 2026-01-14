/**
 * Server-side authentication utilities
 * 
 * These functions are for use in:
 * - Async Server Components
 * - Server Actions
 * - Route Handlers (optional - see supabase-server.ts for API route pattern)
 * 
 * DO NOT use these in Client Components - use getSupabaseClient() instead
 */

import { createServerSupabaseClient } from "./supabase-server";
import { redirect } from "next/navigation";

/**
 * Get current authenticated user
 * Returns null if not authenticated (does not redirect)
 * 
 * @example
 * const user = await getUser();
 * if (!user) return null;
 */
export async function getUser() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this at the top of protected Server Components
 * 
 * @example
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   // user is guaranteed to exist here
 * }
 */
export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Get user profile from database
 * Only works if user is authenticated (should call getUser() first)
 */
export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Profile not found - return null instead of throwing
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Get user with their role from database
 * Combines auth user with role information
 */
export async function getUserWithRole() {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Try to get role from users table
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      ...user,
      role: userData?.role || "patient",
    };
  } catch (error) {
    console.error("Error getting user with role:", error);
    return null;
  }
}

/**
 * Require authentication with role verification
 * Redirects to login if not authenticated or role doesn't match
 * 
 * @param allowedRoles - Array of allowed roles (e.g., ["doctor", "admin"])
 * 
 * @example
 * export default async function AdminPage() {
 *   const user = await requireRole(["admin"]);
 *   // user is guaranteed to exist and have the correct role
 * }
 */
export async function requireRole(allowedRoles: string[]) {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      redirect("/login");
    }

    // Get user role from database
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role || "patient";

    if (!allowedRoles.includes(role)) {
      redirect("/unauthorized");
    }

    return { ...user, role };
  } catch (error) {
    console.error("Error checking role:", error);
    redirect("/login");
  }
}

/**
 * Sign out the user
 * Invalidates the session
 */
export async function signOutUser() {
  const supabase = await createServerSupabaseClient();

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
  }
}

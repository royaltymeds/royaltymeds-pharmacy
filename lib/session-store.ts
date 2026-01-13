import { createClient } from "@supabase/supabase-js";

/**
 * Session management utilities for Netlify-friendly session persistence
 * Instead of relying solely on cookies (which can be lost across serverless invocations),
 * we store session tokens in the database as a fallback
 */

/**
 * Create a new session token and store it in the database
 */
export async function createSession(userId: string) {
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate token using crypto module available in Node.js runtime
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const { error } = await serviceRole.from("sessions").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("Failed to create session:", error);
    return null;
  }

  return { token, expiresAt };
}

/**
 * Validate a session token from the database
 * Use this when cookies aren't available or as a fallback
 */
export async function validateSessionToken(token: string) {
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceRole
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    // Delete expired session
    await serviceRole.from("sessions").delete().eq("token", token);
    return null;
  }

  // Update last_accessed_at
  await serviceRole
    .from("sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("token", token);

  return data.user_id;
}

/**
 * Get user ID from session
 * First tries cookie-based session, then falls back to database token
 */
export async function getUserFromSession(
  supabaseClient: any,
  sessionToken?: string
) {
  // Try to get user from Supabase session first (cookie-based)
  const {
    data: { user: cookieUser },
  } = await supabaseClient.auth.getUser();

  if (cookieUser) {
    return cookieUser;
  }

  // Fallback: Try database session token
  if (sessionToken) {
    const userId = await validateSessionToken(sessionToken);
    if (userId) {
      // Return a minimal user object
      return { id: userId };
    }
  }

  return null;
}

/**
 * Revoke a session token
 */
export async function revokeSession(token: string) {
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceRole
    .from("sessions")
    .delete()
    .eq("token", token);

  if (error) {
    console.error("Failed to revoke session:", error);
    return false;
  }

  return true;
}

/**
 * Cleanup expired sessions (run periodically via cron or edge function)
 */
export async function cleanupExpiredSessions() {
  const serviceRole = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceRole.rpc("cleanup_expired_sessions");

  if (error) {
    console.error("Failed to cleanup expired sessions:", error);
    return false;
  }

  return true;
}

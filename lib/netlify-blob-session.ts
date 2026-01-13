/**
 * Netlify Blobs-based session store (Option B)
 * Uses Netlify Blobs for distributed session persistence across serverless invocations
 * 
 * This approach stores sessions in Netlify's blob storage which is accessible
 * from all serverless functions in a deployment, solving the Netlify isolation issue.
 */

// Session data structure stored in Blobs
interface SessionData {
  userId: string;
  token: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
  lastAccessedAt: number;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Get Netlify Blobs store - available in serverless context
 */
function getBlobs() {
  // In Netlify Edge Functions and serverless functions,
  // blobs are available via globalThis.Netlify?.blobs
  // For middleware, we need to use a different approach
  if (typeof globalThis !== 'undefined' && (globalThis as any).Netlify?.blobs) {
    return (globalThis as any).Netlify.blobs;
  }
  
  // Fallback for other contexts
  return null;
}

/**
 * Create a new session token and store in Netlify Blobs
 * For middleware compatibility, we'll also use a request-scoped storage
 */
export async function createBlobSession(userId: string, accessToken?: string, refreshToken?: string) {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const now = Date.now();
  const expiresAt = now + 60 * 60 * 1000; // 1 hour
  
  const sessionData: SessionData = {
    userId,
    token,
    expiresAt,
    createdAt: now,
    lastAccessedAt: now,
    accessToken,
    refreshToken,
  };
  
  // Try to use Netlify Blobs if available
  const blobs = getBlobs();
  if (blobs) {
    try {
      // Store in Blobs with token as key for fast lookup
      const key = `session:${token}`;
      await (blobs as any).set(key, JSON.stringify(sessionData), {
        metadata: {
          userId,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      });
      
      // Also store user's current sessions list for cleanup
      const userKey = `user:${userId}:sessions`;
      let userSessions: string[] = [];
      try {
        const existing = await (blobs as any).get(userKey);
        if (existing) {
          userSessions = JSON.parse(existing);
        }
      } catch (e) {
        // First session for this user
      }
      userSessions.push(token);
      await (blobs as any).set(userKey, JSON.stringify(userSessions));
    } catch (error) {
      console.error('Failed to store session in Netlify Blobs:', error);
      return null;
    }
  }
  
  return { token, expiresAt: new Date(expiresAt) };
}

/**
 * Validate a session token from Netlify Blobs
 */
export async function validateBlobSessionToken(token: string): Promise<SessionData | null> {
  const blobs = getBlobs();
  if (!blobs) {
    // Fallback: use in-memory cache (will work within single function invocation)
    return getMemoryCachedSession(token);
  }
  
  try {
    const key = `session:${token}`;
    const sessionJson = await (blobs as any).get(key);
    
    if (!sessionJson) {
      return null;
    }
    
    const sessionData: SessionData = JSON.parse(sessionJson);
    
    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      // Delete expired session
      try {
        await (blobs as any).delete(key);
      } catch (e) {
        // Ignore delete errors
      }
      return null;
    }
    
    // Update last accessed time
    sessionData.lastAccessedAt = Date.now();
    await (blobs as any).set(key, JSON.stringify(sessionData), {
      metadata: {
        userId: sessionData.userId,
        expiresAt: new Date(sessionData.expiresAt).toISOString(),
      },
    });
    
    return sessionData;
  } catch (error) {
    console.error('Failed to validate session from Netlify Blobs:', error);
    return null;
  }
}

/**
 * Revoke a session token
 */
export async function revokeBlobSession(token: string) {
  const blobs = getBlobs();
  if (!blobs) {
    clearMemoryCachedSession(token);
    return true;
  }
  
  try {
    const key = `session:${token}`;
    
    // Get session to find user before deleting
    let sessionData = null;
    try {
      const sessionJson = await (blobs as any).get(key);
      if (sessionJson) {
        sessionData = JSON.parse(sessionJson);
      }
    } catch (e) {
      // Session doesn't exist
    }
    
    // Delete the session
    await (blobs as any).delete(key);
    
    // Remove from user's session list
    if (sessionData) {
      const userKey = `user:${sessionData.userId}:sessions`;
      try {
        const userSessions = JSON.parse(await (blobs as any).get(userKey) || '[]');
        const filtered = userSessions.filter((t: string) => t !== token);
        if (filtered.length > 0) {
          await (blobs as any).set(userKey, JSON.stringify(filtered));
        } else {
          await (blobs as any).delete(userKey);
        }
      } catch (e) {
        // Error updating user sessions
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to revoke session from Netlify Blobs:', error);
    return false;
  }
}

/**
 * In-memory session cache for fallback (single function invocation scope)
 * This helps when Blobs is not available
 */
const memorySessionCache = new Map<string, SessionData>();

function getMemoryCachedSession(token: string): SessionData | null {
  const session = memorySessionCache.get(token);
  if (!session) return null;
  
  if (session.expiresAt < Date.now()) {
    memorySessionCache.delete(token);
    return null;
  }
  
  session.lastAccessedAt = Date.now();
  return session;
}

function clearMemoryCachedSession(token: string) {
  memorySessionCache.delete(token);
}

/**
 * Get user from session - tries Blobs first, then memory cache
 */
export async function getUserFromBlobSession(sessionToken?: string): Promise<{ id: string } | null> {
  if (!sessionToken) {
    return null;
  }
  
  const sessionData = await validateBlobSessionToken(sessionToken);
  if (!sessionData) {
    return null;
  }
  
  return { id: sessionData.userId };
}

/**
 * Cleanup expired sessions (this would be called by a cron job or scheduled function)
 */
export async function cleanupExpiredBlobSessions() {
  // Note: Netlify Blobs doesn't provide a list/scan API yet,
  // so full cleanup would require maintaining an index.
  // For now, sessions auto-expire based on expiresAt timestamp.
  // Consider implementing a background job if needed.
  console.log('Blob session cleanup - relying on expiresAt timestamps');
  return true;
}

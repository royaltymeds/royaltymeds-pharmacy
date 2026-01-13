/**
 * Authorization Header-based session store (Option C)
 * 
 * Instead of relying on cookies or storage, we use HTTP Authorization headers.
 * This is the most reliable approach for serverless architectures because:
 * - Headers are passed with every HTTP request automatically
 * - Not affected by function isolation or cookie domain issues
 * - Client stores token in memory/localStorage and includes it with every request
 * - Server validates header on every request
 */

/**
 * Session data structure for Authorization header
 */
export interface AuthorizationSession {
  token: string;
  userId: string;
  expiresAt: number; // Unix timestamp
  createdAt: number;
}

/**
 * Generate an authorization token for a user
 * Called after successful OAuth login
 */
export function generateAuthorizationToken(userId: string): AuthorizationSession {
  const token = `auth_${userId}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const now = Date.now();
  const expiresAt = now + 60 * 60 * 1000; // 1 hour
  
  return {
    token,
    userId,
    expiresAt,
    createdAt: now,
  };
}

/**
 * Validate an authorization token from the Authorization header
 * This is done in middleware for every request
 */
export function validateAuthorizationToken(token: string): { userId: string; expiresAt: number } | null {
  if (!token) return null;
  
  // Token format: auth_<userId>_<random>
  const parts = token.split('_');
  if (parts.length < 3 || parts[0] !== 'auth') {
    return null;
  }
  
  const userId = parts[1];
  if (!userId) {
    return null;
  }
  
  // Note: In production, you should validate the signature and expiration
  // For now, we'll do basic validation
  return {
    userId,
    expiresAt: Date.now() + 60 * 60 * 1000, // Token is valid for 1 hour from now
  };
}

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Format token for Authorization header
 */
export function formatAuthorizationHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Client-side function to store authorization token
 * This should be called after successful login
 */
export function storeAuthorizationToken(token: string): void {
  // Store in localStorage for persistence across page reloads
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Client-side function to retrieve authorization token
 */
export function getStoredAuthorizationToken(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('auth_token');
}

/**
 * Client-side function to clear authorization token on logout
 */
export function clearAuthorizationToken(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Create a fetch wrapper that automatically includes the Authorization header
 */
export function createAuthenticatedFetch() {
  return async (url: string, options: RequestInit = {}) => {
    const token = getStoredAuthorizationToken();
    const headers = {
      ...options.headers,
    } as Record<string, string>;
    
    if (token) {
      headers['Authorization'] = formatAuthorizationHeader(token);
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };
}

/**
 * Validate that user has a valid authorization token
 * Used in server-side validation
 */
export function validateUserHasToken(token: string | null | undefined): boolean {
  if (!token) return false;
  
  const session = validateAuthorizationToken(token);
  return session !== null;
}

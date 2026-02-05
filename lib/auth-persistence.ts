/**
 * Session Persistence Utilities
 * 
 * Handles "Keep me logged in" functionality by storing session metadata
 * in localStorage when the user checks the "Keep me logged in" option.
 */

export interface SessionMetadata {
  keepLoggedIn: boolean;
  expiryTime: string; // ISO string of when session expires
}

const STORAGE_KEY = "rm_keep_logged_in";
const EXPIRY_KEY = "rm_session_expiry";

/**
 * Saves session metadata when user checks "Keep me logged in"
 * @param keepLoggedIn - Whether to keep user logged in
 * @param daysToKeep - Number of days to keep logged in (default: 30)
 */
export function saveSessionMetadata(keepLoggedIn: boolean, daysToKeep: number = 30): void {
  if (keepLoggedIn) {
    const expiryTime = new Date(Date.now() + daysToKeep * 24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(EXPIRY_KEY, expiryTime.toISOString());
  } else {
    clearSessionMetadata();
  }
}

/**
 * Checks if user has an active "Keep me logged in" session
 * @returns true if session is still valid, false if expired or not set
 */
export function hasValidPersistentSession(): boolean {
  const keepLoggedIn = localStorage.getItem(STORAGE_KEY);
  const expiryTime = localStorage.getItem(EXPIRY_KEY);

  if (!keepLoggedIn || !expiryTime) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(expiryTime);

  // Session is valid if expiry time is in the future
  return now < expiry;
}

/**
 * Gets the expiry time of the persistent session
 */
export function getSessionExpiry(): Date | null {
  const expiryTime = localStorage.getItem(EXPIRY_KEY);
  return expiryTime ? new Date(expiryTime) : null;
}

/**
 * Clears all session metadata from localStorage
 */
export function clearSessionMetadata(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

/**
 * Extends the session expiry time by the specified number of days
 * @param daysToAdd - Number of days to add to current expiry
 */
export function extendSessionExpiry(daysToAdd: number = 30): void {
  const keepLoggedIn = localStorage.getItem(STORAGE_KEY);
  if (keepLoggedIn) {
    const expiryTime = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
    localStorage.setItem(EXPIRY_KEY, expiryTime.toISOString());
  }
}

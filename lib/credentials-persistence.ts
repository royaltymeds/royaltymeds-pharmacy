/**
 * Credentials Persistence Utilities
 * 
 * Handles "Remember me" functionality by storing only the username/email
 * in localStorage for convenience on next login. Passwords are never persisted.
 */

export interface SavedCredentials {
  email: string;
  password?: never;
}

const EMAIL_KEY = "rm_saved_email";

/**
 * Saves the user's email when "Remember me" is checked.
 * Passwords are intentionally not saved in browser storage.
 */
export function saveCredentials(email: string): void {
  localStorage.setItem(EMAIL_KEY, email);
}

/**
 * Retrieves saved credentials if "Remember me" was previously enabled
 */
export function getSavedCredentials(): SavedCredentials | null {
  const email = localStorage.getItem(EMAIL_KEY);
  if (email) {
    return { email };
  }

  return null;
}

/**
 * Checks if credentials are saved
 */
export function hassSavedCredentials(): boolean {
  return Boolean(localStorage.getItem(EMAIL_KEY));
}

/**
 * Clears saved credentials from localStorage
 * Called when user logs out or unchecks "Remember me"
 */
export function clearCredentials(): void {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem('rm_saved_password');
}

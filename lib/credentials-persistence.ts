/**
 * Credentials Persistence Utilities
 * 
 * Handles "Remember me" functionality by storing username/email and password
 * in localStorage for convenience on next login.
 */

export interface SavedCredentials {
  email: string;
  password: string;
}

const EMAIL_KEY = "rm_saved_email";
const PASSWORD_KEY = "rm_saved_password";

/**
 * Saves user credentials when "Remember me" is checked
 * Note: Credentials are stored in plain text in localStorage.
 * For production, consider using more secure storage or encryption.
 */
export function saveCredentials(email: string, password: string): void {
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(PASSWORD_KEY, password);
}

/**
 * Retrieves saved credentials if "Remember me" was previously enabled
 */
export function getSavedCredentials(): SavedCredentials | null {
  const email = localStorage.getItem(EMAIL_KEY);
  const password = localStorage.getItem(PASSWORD_KEY);

  if (email && password) {
    return { email, password };
  }

  return null;
}

/**
 * Checks if credentials are saved
 */
export function hassSavedCredentials(): boolean {
  return Boolean(localStorage.getItem(EMAIL_KEY) && localStorage.getItem(PASSWORD_KEY));
}

/**
 * Clears saved credentials from localStorage
 * Called when user logs out or unchecks "Remember me"
 */
export function clearCredentials(): void {
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}

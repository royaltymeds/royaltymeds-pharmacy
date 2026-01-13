/**
 * Client-side hook to handle authorization token setup on login redirect
 * This extracts the token from the URL and stores it in localStorage
 */

'use client';

import { useEffect } from 'react';
import { storeAuthorizationToken, getStoredAuthorizationToken } from '@/lib/auth-header-session';

export function useAuthTokenSetup() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Check if there's an auth_token in the URL (from login redirect)
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    
    if (authToken) {
      // Store the token in localStorage
      storeAuthorizationToken(authToken);
      
      // Clean up URL by removing the token query param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
}

/**
 * Client-side hook to add Authorization header to all fetch requests
 * This should be set up in the layout or app component
 */
export function useAuthorizationHeaderSetup() {
  useEffect(() => {
    // Override global fetch to include Authorization header
    const originalFetch = window.fetch;
    
    window.fetch = function(...args: Parameters<typeof fetch>): ReturnType<typeof fetch> {
      const [resource, config] = args;
      const token = getStoredAuthorizationToken();
      
      if (token) {
        const headers = new Headers((config?.headers) || {});
        headers.set('Authorization', `Bearer ${token}`);
        
        return originalFetch(resource, {
          ...config,
          headers,
        });
      }
      
      return originalFetch(resource, config);
    };
  }, []);
}

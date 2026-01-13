'use client';

import { useAuthTokenSetup, useAuthorizationHeaderSetup } from '@/lib/auth-token-hooks';

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  // Set up Authorization header on all fetch requests
  useAuthorizationHeaderSetup();
  
  // Extract and store token from URL (if present)
  useAuthTokenSetup();

  return <>{children}</>;
}

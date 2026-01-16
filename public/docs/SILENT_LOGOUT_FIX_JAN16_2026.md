# Solution: Silent Logout on First Login - January 16, 2026

## Issue Resolved

### Silent Logout After First Login
**Symptom**: After first login, user briefly appears in portal then is silently redirected to `/login` with a 302 response
- Worked perfectly on subsequent logins after manual logout/login cycle
- Pattern: Only occurred on initial/first login
- Vercel logs showed automatic GET request to `/api/auth/logout?_rsc=16j24`

**Root Cause**: Next.js automatic Link prefetching
- Logout button was implemented as `<Link href="/api/auth/logout">Logout</Link>`
- Next.js automatically prefetches all Link components as RSC (React Server Component) requests in production
- These prefetch requests include the `?_rsc=` query parameter (React Server Component marker)
- The middleware/layout rendered with the logout Link, triggering RSC prefetch of the logout endpoint
- The prefetch request executed the logout endpoint WITHOUT user interaction
- Result: Session was cleared before user interacted with the portal

**Evidence**:
- Request URL: `https://royaltymedsprescript.vercel.app/api/auth/logout?_rsc=16j24`
- Header: `x-matched-path: /api/auth/logout.rsc` (indicates RSC request)
- Referrer: `/patient/home` (portal page)
- Status: 302 Found (automatic redirect to /login)
- This was a **programmatic logout**, not user-initiated

**Solution**: Replace Link component with client-side button
- Created `[components/LogoutButton.tsx](components/LogoutButton.tsx)` - a client component
- Button calls logout via POST with `fetch()` only when user clicks
- Logout endpoint is no longer prefetched automatically
- Logout only executes on explicit user action

**Files Modified**:
- Created: `/components/LogoutButton.tsx`
- Updated: `/app/patient/layout.tsx` - Replaced `<Link href="/api/auth/logout">` with `<LogoutButton />`
- Updated: `/app/doctor/layout.tsx` - Replaced `<Link href="/api/auth/logout">` with `<LogoutButton />`
- Updated: `/app/admin/layout.tsx` - Replaced `<Link href="/api/auth/logout">` with `<LogoutButton />`

**Implementation**:

```typescript
// components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
    >
      Logout
    </button>
  );
}
```

**Usage in Layouts**:
```typescript
// Before
<Link href="/api/auth/logout" className="...">
  Logout
</Link>

// After
<LogoutButton className="..." />
```

## Key Lessons

### 1. Next.js Link Prefetching in Production
- **Rule**: Link components automatically prefetch in production
- **Risk**: Any side-effects in prefetched routes execute without user interaction
- **Solution**: Avoid Links for destructive operations (logout, delete, etc.)
- **Pattern**: Use `<button>` with onClick handlers for state-changing operations

### 2. RSC (React Server Component) Requests
- **Identifier**: Query parameter `?_rsc=` indicates RSC prefetch request
- **Behavior**: Browser prefetch = no user action required = route executes
- **Detection**: Check `x-matched-path` header for `.rsc` suffix
- **Mitigation**: Route guards won't help; prevent via UI pattern change

### 3. Production-Only Issues
- **Context**: This bug only occurred on Vercel production, not localhost
- **Reason**: Development server doesn't prefetch; production optimizations enable prefetch
- **Implication**: Always test auth flows on actual production deployment
- **Prevention**: Consider disabling Link prefetching for auth-related operations

## Verification

✅ First login now works without silent logout
✅ Session persists from login through portal navigation  
✅ Logout button only triggers when user clicks
✅ Build passes: 0 errors, 32 pages generated
✅ Deployment successful to Vercel production
✅ No more automatic 302 redirects during login flow

## Related Fixes from This Session

This fix was part of comprehensive authentication debugging:
1. ✅ Fixed 401 "Unauthorized" errors by adding `export const dynamic = "force-dynamic"` to API routes
2. ✅ Fixed middleware not running on API routes by updating matcher regex
3. ✅ Migrated from custom CookieStorage to Supabase SSR's `createBrowserClient`
4. ✅ Converted layouts to async server components with server-side auth checks
5. ✅ Applied race condition mitigation with 200ms delay + `router.refresh()`
6. ✅ **Fixed silent logout by replacing Link with client-side LogoutButton** ← Final fix

All issues now resolved. Authentication flow working reliably on first login.

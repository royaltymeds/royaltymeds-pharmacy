# Solution: Auth 401 Errors and Patient Filtering - January 15, 2026

## Issues Resolved

### Issue 1: Doctor Prescriptions Page Returning 401 Unauthorized
**Symptom:** Doctor users couldn't load prescriptions; API returned 401 auth errors

**Root Cause:** Browser fetch calls were not including authentication cookies in request headers. The Supabase client stores auth tokens in cookies, but the fetch API doesn't automatically send them without explicit configuration.

**Solution:** Added `credentials: "include"` to all fetch calls to ensure cookies are sent with each API request.

**Files Modified:**
- `/app/doctor/my-prescriptions/page.tsx`
- `/app/doctor/dashboard/page.tsx`
- `/app/doctor/patients/page.tsx`
- `/app/patient/home/page.tsx`
- `/app/patient/orders/page.tsx`
- `/app/patient/refills/page.tsx`
- `/app/patient/messages/page.tsx`

**Example Fix:**
```typescript
// Before
const response = await fetch("/api/doctor/prescriptions");

// After
const response = await fetch("/api/doctor/prescriptions", {
  credentials: "include",
});
```

### Issue 2: Doctor Patients Page Showing All Users (Including Doctors)
**Symptom:** Doctor portal showed doctor accounts in the patients list instead of only patient accounts

**Root Cause:** `/api/doctor/patients` route was querying the `users` table without filtering by role

**Solution:** Added `.eq("role", "patient")` filter to only return patient accounts

**File Modified:** `/api/doctor/patients/route.ts`

**Code Change:**
```typescript
let query = supabase
  .from("users")
  .select("id, email, user_profiles(full_name, phone)")
  .eq("role", "patient");  // Only fetch patients, not doctors or admins
```

### Issue 3: Sign-In Failing After Vercel Deployment
**Symptom:** After deployment, login showed error: "supabaseUrl is required"

**Root Cause:** Environment variables were not configured in Vercel. The `.env.local` file is local-only and not committed to git. Vercel needs these variables set in its project dashboard.

**Solution:** Set the following environment variables in Vercel dashboard (Settings > Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SERVICE_ROLE_KEY]
STORAGE_BUCKET=royaltymeds_storage
SUPABASE_DB_URL=[REDACTED_DB_URL]
SUPABASE_REF=[PROJECT_REF]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[REDACTED_PUBLISHABLE_KEY]
```

**Important:** These variables must be set for each deployment environment (Production, Preview, Development as applicable).

## Technical Details

### Why `credentials: "include"` Was Needed

The application uses Supabase SSR with a custom `CookieStorage` class that stores auth tokens in HTTP cookies. The middleware (`middleware.ts`) refreshes the session and sets cookies automatically. However, the browser's fetch API does not send cookies by default unless explicitly configured.

The fix ensures:
1. Auth cookies are sent with every API request
2. The `createClientForApi()` function in API routes can extract the auth context from request cookies
3. RLS policies on the database can be enforced based on `auth.uid()`

### Authentication Flow

1. User logs in via `LoginForm` component
2. Supabase client stores auth tokens in cookies (via `CookieStorage`)
3. Middleware refreshes session and manages cookies
4. Client pages fetch data from API routes with `credentials: "include"`
5. API routes use `createClientForApi(request)` to get Supabase client with auth context
6. Database RLS policies enforce access control

## Testing

After applying these fixes:
- ✅ Doctor can sign in without 401 errors
- ✅ Doctor prescriptions page loads successfully
- ✅ Doctor patients page shows only patient accounts
- ✅ Patient pages work without 401 errors
- ✅ All RLS policies are properly enforced

## Deployment Checklist

When deploying to a new environment:
1. ✅ Set all required environment variables in Vercel
2. ✅ Ensure `credentials: "include"` is present in all fetch calls
3. ✅ Verify API routes have `export const dynamic = "force-dynamic"`
4. ✅ Test sign-in flow on deployed version
5. ✅ Verify role-based access (doctors see doctor pages, patients see patient pages)

## Related Files

- `/lib/supabase-client.ts` - Client-side Supabase setup with CookieStorage
- `/lib/supabase-server.ts` - Server-side Supabase client for API routes
- `/middleware.ts` - Session refresh and cookie management
- `/app/api/doctor/prescriptions/route.ts` - Doctor prescriptions API
- `/app/api/doctor/patients/route.ts` - Doctor patients list API with role filtering

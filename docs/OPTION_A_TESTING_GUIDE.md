# Option A: Database Session Store - Testing Guide

## What Was Changed

### 1. Database Schema
A new `sessions` table was created to store session tokens as a fallback to cookies. This is necessary because Netlify's serverless architecture doesn't guarantee cookie persistence across function invocations.

**File**: `/docs/migrations/add_sessions_table.sql`
- Stores: `user_id`, `token` (unique), `access_token`, `refresh_token`, `expires_at`, `created_at`, `last_accessed_at`
- 1-hour expiration window
- Automatic cleanup of expired sessions
- Row-level security for user privacy

### 2. Session Utilities Library
Created utility functions to manage database sessions.

**File**: `/lib/session-store.ts`
- `createSession(userId)` - Called after OAuth to store token in DB
- `validateSessionToken(token)` - Queries DB to validate token when cookies fail
- `getUserFromSession()` - Cookie-first, database-fallback approach

### 3. OAuth Callback Updated
Now creates database session token immediately after successful OAuth exchange.

**File**: `/app/auth/callback/route.ts`
- After `exchangeCodeForSession()` succeeds, calls `createSession()`
- Stores session token in `session_token` cookie
- Ensures user can maintain session even if cookies are lost

### 4. Middleware Enhanced
Middleware now validates database session tokens as fallback when cookies aren't available.

**File**: `/middleware.ts`
- When `getSession()` returns null (cookie unavailable), tries database token
- Sets response headers to indicate database session is valid
- Maintains all existing route protection logic

## How to Test Locally

### 1. Apply Database Migration
You need to apply the SQL migration to your Supabase database:

```bash
# Log into Supabase
# 1. Go to: https://app.supabase.com
# 2. Select your project (royaltymeds_prescript)
# 3. Go to SQL Editor
# 4. Create a new query
# 5. Copy contents from: docs/migrations/add_sessions_table.sql
# 6. Click "Run"
```

Or use Supabase CLI:
```bash
supabase migration add create_sessions_table
# Then paste the SQL content into the migration file
supabase db push
```

### 2. Test Login Flow
```
1. Open http://localhost:3000
2. Click "Login" 
3. Sign in with a test account (or create one)
4. You should be redirected to home/dashboard
5. Check browser DevTools → Application → Cookies:
   - Look for `session_token` cookie (new)
   - Should have same value as in `/lib/session-store.ts` output
```

### 3. Test Session Persistence (The Key Test)
```
1. After login, navigate between pages by clicking:
   - Navbar links (Patient home, Messages, Orders, Refills, Profile)
   - Sidebar links (same)
   - Type URLs directly in address bar

CRITICAL: If this test FAILS, you'll see 302 redirects to /login (logout)
If PASSES: You stay logged in and can navigate freely

2. Refresh the page at different URLs:
   - /patient/home
   - /patient/orders
   - /patient/refills
   - /patient/messages
   - /profile
   
Should remain logged in after each refresh.

3. Open multiple tabs:
   - Login in tab 1
   - Open /patient/orders in tab 2
   - Should already be logged in (not redirected to login)
   
4. Clear cookies manually, refresh page:
   - DevTools → Application → Cookies → Delete all
   - Refresh page
   - Should STILL be logged in (database token fallback working!)
   
This last test demonstrates the fix: even with no cookies, 
the database session token allows authentication to continue.
```

### 4. Check Server Logs
Watch the terminal running `npm run dev` for:
- No TypeScript errors
- Session validation logs (if added)
- Any Supabase errors

### 5. Test Logout
```
1. Click Logout button
2. Should redirect to /login
3. Cookie `session_token` should be deleted
4. Database session token should be revoked
```

## Deployment Testing (After Local Success)

If local testing passes:

```bash
# 1. Commit changes
git add -A
git commit -m "Option A: Add database session store for Netlify compatibility"

# 2. Deploy to Netlify
netlify deploy --prod

# 3. Test same scenarios on production:
#    - Login
#    - Navigate (key test - should NOT see logout redirects)
#    - Refresh pages
#    - Multi-tab test
#    - Verify cookies still work but fallback to DB if cleared
```

## Expected Results for Option A Success

✅ **Success Indicators**:
- Login works normally
- Navigating between pages keeps you logged in (no 302 redirects to /login)
- Refreshing pages maintains session
- Session works across multiple browser tabs
- Clearing cookies doesn't cause logout (database fallback works)
- On Netlify production: No more session loss when navigating

⚠️ **Partial Success** (fallback working but not ideal):
- You can navigate if you DON'T clear cookies
- Database fallback works IF cookies are cleared
- This would mean option B or C needed

❌ **Failure** (database sessions aren't being created/used):
- Still getting logged out on navigation
- `session_token` cookie not created after login
- Database validation not triggering

## Troubleshooting

**Q: `session_token` cookie not appearing after login?**
A: 
- Check that `createSession()` in `/lib/session-store.ts` is being called
- Verify `SUPABASE_SERVICE_ROLE_KEY` environment variable is set
- Check Supabase logs for errors creating sessions table record

**Q: Still getting logged out on navigation?**
A:
- Middleware might not be executing properly
- Check that `validateSessionToken()` is being called
- Verify middleware matches included routes
- Database migration might not have been applied

**Q: Database session tokens not validating?**
A:
- Ensure `sessions` table exists in Supabase (run migration)
- Verify token is being created with correct `user_id`
- Check token expiration logic (should be 1 hour from now)

## Next Steps

If Option A **SUCCEEDS** on Netlify:
- ✅ Done! This is the solution.
- Document in tracking file
- Consider adding refresh token rotation in future
- Monitor session expiration on long sessions

If Option A **FAILS**:
- Try Option B: Netlify Blobs session cache
- Or Option C: Authorization headers approach

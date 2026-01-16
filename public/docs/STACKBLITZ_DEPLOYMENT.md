# StackBlitz Deployment Guide

## Overview
This guide helps you deploy the RoyaltyMeds Pharmacy Platform to StackBlitz with proper Next.js and dependency configuration.

## Issues & Solutions

### 1. **Potential Dependency Issues on StackBlitz**

StackBlitz's WebContainer has some limitations with native dependencies. The `pg` package (PostgreSQL client) is frontend-only and may cause issues.

**Solution:** Remove `pg` from dependencies since Supabase handles database connections:

```bash
npm uninstall pg
```

This dependency isn't used in the frontend code - it was likely added by mistake.

### 2. **Module Type Compatibility**

The `"type": "module"` in package.json might cause issues with some build tools in StackBlitz's environment.

**Solution:** Keep it as-is (Next.js 15 supports ES modules), but ensure all dependencies are ES-module compatible.

### 3. **Environment Variables**

StackBlitz doesn't have direct access to `.env.local` files. 

**Solution:** Use the `.stackblitzrc.json` file we created which has the public variables.

## Steps to Deploy to StackBlitz

### Step 1: Remove Unnecessary Dependencies
```bash
npm uninstall pg
git add package.json package-lock.json
git commit -m "Remove: Remove pg dependency (not needed for frontend)"
git push origin main
```

### Step 2: Open in StackBlitz
1. Go to: https://stackblitz.com/github/royaltymeds/royaltymeds-pharmacy
2. StackBlitz will automatically:
   - Clone your GitHub repo
   - Install dependencies
   - Load the project

### Step 3: Set Environment Variables
1. Click the gear icon (settings) in StackBlitz
2. Go to "Secrets" or "Environment"
3. Add:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_DB_URL=your_database_url
   SUPABASE_REF=your_supabase_ref
   ```

### Step 4: Start Development Server
```bash
npm run dev
```

StackBlitz will show a preview URL automatically.

### Step 5: Deploy (if using StackBlitz App Hosting)
1. Click "Deploy" button in StackBlitz
2. Follow the deployment wizard
3. Connect your GitHub account
4. Select auto-deploy on push

## Troubleshooting

### Error: "Cannot find module 'pg'"
**Solution:** `pg` has been removed from dependencies (Step 1)

### Error: "ENOSPC: no space left on device"
**Solution:** Clear StackBlitz cache - this is a WebContainer memory issue and usually resolves itself

### Error: "Supabase connection failed"
**Solution:** Verify environment variables are set correctly in StackBlitz Secrets

### Port Already in Use
**Solution:** StackBlitz automatically assigns ports, just use the preview URL it provides

### Portal Pages Not Loading After Login (FIXED ✅)
**Previous StackBlitz Auth Issue**: Portal pages would not load after successful login due to fragile async context.

**Status**: FIXED in Jan 14 Update ✅
- All portal pages converted from async Server Components to client components
- Auth flow enhanced with retry logic and longer session initialization delays
- AuthGuard detects recent authentication and retries more aggressively
- Session properly synced before portal access

**If issue still occurs**:
1. Check browser console for error messages (look for [AuthGuard] logs)
2. Verify Supabase environment variables are set in Secrets
3. Check localStorage for session data
4. Clear StackBlitz cache and reload

See [COMPLETE_FIX_SUMMARY_JAN14.md](COMPLETE_FIX_SUMMARY_JAN14.md) for detailed auth architecture.

## Authentication Flow (Optimized for StackBlitz)

```
User Login
    ↓
/auth/callback exchanges OAuth code for session
    ↓
/auth/success waits 800ms for session initialization
    ↓
AuthGuard verifies session with retries (up to 3 attempts)
    ↓
Portal loads (client-side data fetching via useEffect)
    ↓
User can access prescriptions, orders, messages, etc.
```

**Key improvements**:
- ✅ No "cookies() not available" build warnings
- ✅ All portal pages static-prerenderable  
- ✅ Works on StackBlitz, localhost, and production
- ✅ Handles transient initialization issues gracefully

## Key Files for StackBlitz Deployment

- `stackblitz.json` - Main StackBlitz configuration
- `.stackblitzrc.json` - Runtime environment configuration
- `netlify.toml` - Build configuration (also works for reference)
- `/components/auth/AuthGuard.tsx` - Auth verification with retries
- `/app/auth/success/page.tsx` - Session initialization bridge

## Local Testing Before StackBlitz

To test locally (mimicking StackBlitz environment):

```bash
# Install dependencies fresh
npm ci

# Build (what StackBlitz will do)
npm run build

# Start dev server
npm run dev
```

If all these work locally, it will work on StackBlitz.

## Next Steps After Deployment

1. **Test all portals:**
   - Patient: Login → success page → home (check [AuthGuard] console logs)
   - Doctor: Login → success page → dashboard
   - Admin: Login → success page → dashboard

2. **Verify features:**
   - Authentication flow (check browser DevTools console)
   - Data persistence (create/edit data, refresh page)
   - Middleware protection (try accessing /patient/home without login)
   - Session handling (logout and login again)
   - AuthGuard retry logic (slow network simulation)

3. **Monitor performance:**
   - Check WebContainer resource usage
   - Monitor API response times
   - Verify database connections
   - Review console for any [AuthGuard] or [AuthSuccess] logs

## Resources

- StackBlitz Docs: https://stackblitz.com/docs
- Next.js on StackBlitz: https://stackblitz.com/github/vercel/next.js
- Your GitHub: https://github.com/royaltymeds/royaltymeds-pharmacy
- **Auth Fix Details**: [COMPLETE_FIX_SUMMARY_JAN14.md](COMPLETE_FIX_SUMMARY_JAN14.md)
- **Root Cause Analysis**: [ROOT_CAUSE_FIX.md](ROOT_CAUSE_FIX.md)

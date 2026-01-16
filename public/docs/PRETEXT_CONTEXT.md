# RoyaltyMeds Prescription Platform - Context & Commands

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy --prod

# Set Vercel environment variables
vercel env add VARIABLE_NAME
```

## Project Overview

**Type:** Next.js 14 full-stack application
**Auth:** Supabase Authentication + RLS Policies
**Database:** PostgreSQL via Supabase
**Deployment:** Vercel
**URL:** https://royaltymedsprescript.vercel.app

## Key Architecture Decisions

### Authentication Pattern
- **Client-side login:** Supabase client (`getSupabaseClient()`)
- **Tokens stored in:** HTTP cookies via custom `CookieStorage` class
- **Server-side auth:** `createClientForApi()` extracts cookies from NextRequest
- **Session refresh:** Middleware handles automatic token refresh

### API Design
- All protected pages use `'use client'` directive
- Data fetching via `useEffect` calling API routes
- **CRITICAL:** All fetch calls must include `credentials: "include"` to send cookies
- API routes must include `export const dynamic = "force-dynamic"`

### Page Structure
```
/app
├── (auth)/          # Public auth pages
├── patient/         # Patient portal (role-based)
├── doctor/          # Doctor portal (role-based)
├── admin/           # Admin dashboard
└── api/             # API routes for data fetching
```

## Critical Fixes Applied (January 15, 2026)

### 1. 401 Auth Errors on Doctor Pages
**Fix:** Added `credentials: "include"` to all fetch calls to send auth cookies

**Files Updated:**
- `/app/doctor/my-prescriptions/page.tsx`
- `/app/doctor/dashboard/page.tsx`
- `/app/doctor/patients/page.tsx`
- `/app/patient/home/page.tsx`
- `/app/patient/orders/page.tsx`
- `/app/patient/refills/page.tsx`
- `/app/patient/messages/page.tsx`

### 2. Doctor Patients Page Showing All Users
**Fix:** Added role filtering (`.eq("role", "patient")`) to `/api/doctor/patients/route.ts`

### 3. Sign-In Failures After Vercel Deployment
**Fix:** Set environment variables in Vercel dashboard (see REQUIRED_ENV_VARS below)

## REQUIRED Environment Variables

**MUST be set in Vercel dashboard (Settings > Environment Variables):**

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED_SERVICE_ROLE_KEY]
STORAGE_BUCKET=royaltymeds_storage
SUPABASE_DB_URL=[REDACTED_DB_URL]
SUPABASE_REF=[PROJECT_REF]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[REDACTED_PUBLISHABLE_KEY]
```

## Key Files

### Authentication
- `lib/supabase-client.ts` - Client-side Supabase with CookieStorage
- `lib/supabase-server.ts` - Server-side Supabase helpers
- `middleware.ts` - Session refresh and cookie management
- `components/auth/LoginForm.tsx` - Login component

### API Routes
- `app/api/doctor/prescriptions/route.ts` - Doctor prescriptions (with auth)
- `app/api/doctor/patients/route.ts` - Doctor patients list (filtered by role)
- `app/api/doctor/stats/route.ts` - Dashboard statistics
- `app/api/patient/*` - Patient data endpoints

### Database Schema
- 12 tables with RLS policies
- `users` table with `role` column (patient, doctor, admin)
- Role-based access control enforced via RLS

## Common Issues & Solutions

### Issue: 401 Unauthorized on API calls
**Solution:** Ensure fetch call includes `credentials: "include"`
```typescript
const response = await fetch("/api/endpoint", {
  credentials: "include",
});
```

### Issue: Sign-in not working after deployment
**Solution:** Check Vercel environment variables are set (see REQUIRED_ENV_VARS above)

### Issue: User sees wrong data or can't access pages
**Solution:** Verify RLS policies in Supabase - they enforce access based on `auth.uid()` and `role`

### Issue: Build fails with "Dynamic server usage"
**Solution:** Add `export const dynamic = "force-dynamic"` to API routes that use cookies/request

## Testing Accounts

### Development/Staging
Check the database or use the admin create-user endpoint to create test accounts:
- Doctor account (role='doctor')
- Patient account (role='patient')
- Admin account (role='admin')

## Deployment Notes

1. **Always set environment variables in Vercel before/after deploying**
2. **Test sign-in on production after each deployment**
3. **Verify role-based access** (doctors see doctor pages, patients see patient pages)
4. **Check console for auth errors** if pages don't load

## Related Documentation

- `docs/SOLUTION_AUTH_FIXES_JAN_2026.md` - Detailed explanation of auth fixes
- `docs/MIGRATION_GUIDE.md` - Database setup and migrations
- `docs/ARCHITECTURE.md` - System architecture overview

## Support

For issues with:
- **Auth/Login:** Check environment variables and `supabase-client.ts` CookieStorage
- **API calls returning 401:** Add `credentials: "include"` to fetch calls
- **Database access:** Check RLS policies in Supabase dashboard
- **Build errors:** Ensure API routes have `export const dynamic = "force-dynamic"`

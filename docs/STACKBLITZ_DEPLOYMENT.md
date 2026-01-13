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

## Key Files for StackBlitz Deployment

- `stackblitz.json` - Main StackBlitz configuration
- `.stackblitzrc.json` - Runtime environment configuration
- `netlify.toml` - Build configuration (also works for reference)

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
   - Patient: Login, navigate between pages
   - Doctor: Dashboard, submit prescription
   - Admin: Dashboard, manage data

2. **Verify features:**
   - Authentication flow
   - Data persistence
   - Middleware protection
   - Session handling

3. **Monitor performance:**
   - Check WebContainer resource usage
   - Monitor API response times
   - Verify database connections

## Resources

- StackBlitz Docs: https://stackblitz.com/docs
- Next.js on StackBlitz: https://stackblitz.com/github/vercel/next.js
- Your GitHub: https://github.com/royaltymeds/royaltymeds-pharmacy

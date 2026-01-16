# Netlify Environment Variables Setup

## ⚠️ CRITICAL: Secret Management

### Problem
The Netlify build was failing because private Supabase keys were being exposed in the compiled Next.js bundles.

### Solution
**Never set private environment variables in netlify.toml build.environment section.**

Private keys will be:
- Embedded in JavaScript bundles
- Visible in the `/.netlify/.next/cache/` directory
- Exposed to the browser
- Flagged by secret scanning tools

---

## ✅ How to Set Up Environment Variables in Netlify

### 1. **PUBLIC Variables** (Set in netlify.toml)
These are safe to expose to the client and should be prefixed with `NEXT_PUBLIC_`:

```toml
[build.environment]
  NEXT_PUBLIC_SUPABASE_URL = "your_url"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "your_anon_key"
  STORAGE_BUCKET = "your_bucket"
```

### 2. **PRIVATE Variables** (Set in Netlify UI ONLY, not in netlify.toml)
Do NOT set these in netlify.toml. Instead:

1. Go to your Netlify project dashboard
2. **Site Settings** → **Build & Deploy** → **Environment**
3. Click **Edit variables** (not in netlify.toml)
4. Add these environment variables:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `SUPABASE_REF`
   - Any other private credentials

### 3. **Runtime-Only Variables**
Set the private variables with a **function context** or **deploy context** so they're only available to functions, not the build:

**For Netlify Functions:**
```toml
[context.production.environment]
  SUPABASE_SERVICE_ROLE_KEY = "use_netlify_ui"
```

**Best Practice:** Set ALL private keys via Netlify UI → **Environment variables** (not in netlify.toml)

---

## 📋 Current Setup

### In netlify.toml (PUBLIC ONLY)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` ✅
- `STORAGE_BUCKET` ✅

### In Netlify UI → Environment (PRIVATE ONLY)
Set via dashboard, NOT in code:
- `SUPABASE_SERVICE_ROLE_KEY` 🔒
- `SUPABASE_DB_URL` 🔒
- `SUPABASE_REF` 🔒

---

## 🔍 Verify Setup

After updating, the build should:
1. ✅ NOT bundle private keys into `.netlify/.next/cache/webpack/*`
2. ✅ NOT expose private keys in `.netlify/.next/server/` files
3. ✅ Pass Netlify secrets scanning
4. ✅ Still allow API routes to access private keys via `process.env`

---

## 🐛 Debugging

If secrets are still exposed:

1. **Check netlify.toml**
   ```bash
   grep -E "SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_URL|SUPABASE_REF" netlify.toml
   # Should find nothing if using UI
   ```

2. **Check Netlify Environment**
   - Dashboard → Site Settings → Build & Deploy → Environment
   - Should show private keys here, NOT in netlify.toml

3. **Clear Cache**
   - Netlify Dashboard → Site Settings → Build & Deploy
   - Click **Clear cache and retry latest deploy**

4. **Check Build Logs**
   - Look for "found value at line X in `.netlify/.next/cache/webpack/*`"
   - Indicates private key is being bundled

---

## 📚 References

- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [Next.js Public Environment Variables](https://nextjs.org/docs/basic-features/environment-variables#bundling-environment-variables-for-the-browser)
- [Netlify Secrets Scanning](https://docs.netlify.com/configure-builds/manage-dependencies/#prevent-secrets-from-being-exposed)

**Status:** ✅ Updated Jan 12, 2026

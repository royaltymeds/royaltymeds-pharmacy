# Supabase Security Fixes - Function Search Path

**Date:** January 10, 2026
**Issue:** Supabase Advisor warnings - Function Search Path Mutable
**Status:** ✅ Migration files updated, needs manual application

---

## Problem Summary

Supabase Advisor detected 4 security warnings on custom database functions:

```
[WARNING] Function Search Path Mutable
- current_user_id()
- current_user_role()
- update_updated_at_column()
- audit_log_action()
```

### Why This Matters

When a PostgreSQL function doesn't explicitly set the `search_path`, it uses the caller's session search path, which can be mutable. This can lead to privilege escalation attacks if:

1. A malicious user changes their search path
2. The function then uses the wrong schema/table
3. Security checks are bypassed through schema confusion

**Severity:** WARNING (SECURITY)
**Risk Level:** Medium
**Impact:** Potential privilege escalation attacks

---

## Solution: Add `SET search_path = public`

All functions need to explicitly set their search path to prevent this vulnerability.

### What Changed

Each function definition now includes `SET search_path = public` after the `LANGUAGE` specification:

#### Before:
```sql
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT ...
$$ LANGUAGE SQL STABLE;
```

#### After:
```sql
CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT ...
$$ LANGUAGE SQL STABLE SET search_path = public;
```

---

## Files Updated

### 1. Migration Files (Already Updated ✅)
- ✅ `supabase/migrations/20260108000000_create_prescription_platform.sql`
- ✅ `scripts/migration.sql`

These files now include the `SET search_path = public` parameter in all function definitions.

### 2. New Fix File
- ✅ `scripts/fix-function-search-path.sql` (NEW)

Contains all 4 fixed functions ready to apply to Supabase.

### 3. Application Script
- ✅ `scripts/apply-security-fixes.js`

Provides instructions for applying the security fixes.

---

## How to Apply the Fix

### Option 1: Supabase Dashboard (Recommended)

1. Go to: **https://app.supabase.com/**
2. Select your project: **[REDACTED]**
3. Navigate to: **SQL Editor** → **New Query**
4. Copy the entire contents of: `scripts/fix-function-search-path.sql`
5. Paste into the SQL Editor
6. Click: **Run** (or press Ctrl+Enter)

### Option 2: PostgreSQL CLI

If you have PostgreSQL tools installed locally:

```bash
psql -h db.[YOUR-PROJECT].supabase.co \
     -d postgres \
     -U postgres \
     -f scripts/fix-function-search-path.sql
```

When prompted, enter your PostgreSQL password.

### Option 3: Run the Information Script

```bash
node scripts/apply-security-fixes.js
```

This provides the above instructions in an interactive format.

---

## The Fix SQL

All 4 functions need to be updated:

```sql
-- Fix 1: Get current user ID
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    ''
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Fix 2: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'patient'
  );
$$ LANGUAGE SQL STABLE SET search_path = public;

-- Fix 3: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 4: Create audit log entry
CREATE OR REPLACE FUNCTION public.audit_log_action(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_changes)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Verification

After applying the fix, Supabase Advisor should show:

✅ **0 warnings** on all functions

To verify:
1. Go to **Supabase Dashboard**
2. Click **Database** → **Advisors**
3. Re-run the linter check
4. Confirm all "Function Search Path Mutable" warnings are gone

---

## Technical Details

### What `SET search_path = public` Does

- **Locks down search path:** The function always uses the `public` schema
- **Prevents privilege escalation:** Malicious schema swaps can't affect the function
- **No performance impact:** Just one more parameter, no execution overhead
- **Standard practice:** Recommended by PostgreSQL security best practices

### Why This Is Safe

All our custom functions only operate on tables in the `public` schema:
- `audit_logs` - public schema
- `users` - public schema
- All other tables - public schema

No functions need to access other schemas, so locking to `public` is safe and recommended.

### Functions Modified

| Function | Purpose | Change |
|----------|---------|--------|
| `current_user_id()` | Extract user ID from JWT | Added `SET search_path = public` |
| `current_user_role()` | Extract user role from JWT | Added `SET search_path = public` |
| `update_updated_at_column()` | Trigger to update timestamps | Added `SET search_path = public` |
| `audit_log_action()` | Create audit log entries | Added `SET search_path = public` |

---

## Timeline

- **Created:** Migration files with fix (January 10, 2026)
- **Status:** Ready to apply
- **Expected:** 1 minute to apply via Supabase Dashboard

---

## References

- [PostgreSQL Function Security](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Supabase Advisor - Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)

---

## Next Steps

1. ✅ Migration files updated (DONE)
2. ⏳ Apply fix via Supabase Dashboard (PENDING)
3. ✅ Verify warnings are gone (PENDING)

**Once applied, your database will have:**
- ✅ 0 security warnings
- ✅ Full compliance with PostgreSQL best practices
- ✅ Protected against search path privilege escalation

---

**Status:** Ready for manual application
**Estimated Time:** 1-2 minutes
**Difficulty:** Easy (copy and paste SQL)

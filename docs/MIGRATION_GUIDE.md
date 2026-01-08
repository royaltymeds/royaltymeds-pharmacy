# Phase 1 Migration Guide

## Overview
Since the migration script cannot connect directly from this environment, use **Option 1** (recommended) or **Option 2** below.

---

## Option 1: Supabase Web Dashboard (RECOMMENDED)

1. **Navigate to Supabase Dashboard**
   - Go to: https://app.supabase.com/
   - Select your project "fsaxrfjuyxetvbnoydns"

2. **Open SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"+ New Query"**

3. **Copy & Paste Migration**
   - Open the file: `scripts/migration.sql`
   - Copy all contents
   - Paste into the SQL Editor in Supabase dashboard

4. **Execute**
   - Click **"Run"** button (or Cmd/Ctrl + Enter)
   - Wait for success message
   - Verify schema "royaltymeds" appears in the Schema dropdown

---

## Option 2: PostgreSQL CLI (psql)

**Requirements:**
- PostgreSQL client installed (`psql`)
- Network access to Supabase (may need IP whitelisted)

**Steps:**

```bash
# 1. Set environment variable (Windows PowerShell)
$env:PGPASSWORD = "KodeKeyAlpha"

# 2. Run migration
psql -h db.fsaxrfjuyxetvbnoydns.supabase.co -U postgres -d postgres -f scripts/migration.sql

# 3. Verify
psql -h db.fsaxrfjuyxetvbnoydns.supabase.co -U postgres -d postgres -c "\dn royaltymeds"
```

---

## Option 3: Supabase CLI (if installed)

```bash
supabase db push --db-url "postgresql://postgres:KodeKeyAlpha@db.fsaxrfjuyxetvbnoydns.supabase.co:5432/postgres"
```

---

## Verification

After migration completes, verify in the Supabase dashboard:

1. **Schema**: You should see "royaltymeds" in the Schema selector
2. **Tables**: Navigate to "Table Editor" and verify these tables exist:
   - users
   - user_profiles
   - prescriptions
   - orders
   - prescription_items
   - refills
   - deliveries
   - messages
   - reviews
   - testimonials
   - payments
   - audit_logs

3. **RLS Enabled**: Go to any table → Click **"RLS"** button → Should show "ON"

---

## What Was Created

### Tables (12 total)
- **users**: Core user accounts (patient, admin, doctor)
- **user_profiles**: Extended user info (phone, address, license, etc.)
- **prescriptions**: Prescription documents and metadata
- **orders**: Patient orders linked to prescriptions
- **prescription_items**: Individual items in prescriptions (brand vs generic)
- **refills**: Refill tracking and management
- **deliveries**: Shipping and courier tracking
- **messages**: Patient-Admin communication threads
- **reviews**: Product/service reviews
- **testimonials**: Public testimonials for marketing
- **payments**: Payment records and transaction history
- **audit_logs**: Security audit trail

### Security Features
- **Row Level Security (RLS)**: Every table has RLS enabled
- **Access Policies**:
  - Patients see only their own data
  - Doctors see only their prescriptions
  - Admins see all data
  - Public testimonials are visible to everyone
- **Audit Logging**: All changes tracked with user ID and action type

### Automated Features
- **Timestamps**: All tables auto-update `updated_at` on modifications
- **UUID Primary Keys**: All tables use UUID for IDs
- **Foreign Keys**: Relationships enforced with cascade deletes where appropriate
- **Indexes**: Created on frequently queried columns (email, status, user IDs)

---

## Next Steps (Phase 2)

After migration completes:

1. ✅ Run: `npm install` (already done)
2. ✅ Create `.env.local` (already done)
3. ✅ Create migration script (already done)
4. 👉 **Execute migration** (use Option 1-3 above)
5. 🔗 Set up Auth routes (Phase 2)
6. 👤 Create user signup/login flows
7. 🎯 Begin Patient Dashboard

---

## Troubleshooting

**Error: "schema 'royaltymeds' already exists"**
- The schema was created in a previous run
- You can safely continue; the RLS policies will overwrite

**Error: "cannot grant ... to public"**
- This is expected for some Supabase environments
- Check that RLS is working correctly

**Error: Connection timeout**
- Verify your IP is whitelisted in Supabase settings
- Check Network Connectivity

---

**Questions?** Check the Supabase docs: https://supabase.com/docs/guides/database

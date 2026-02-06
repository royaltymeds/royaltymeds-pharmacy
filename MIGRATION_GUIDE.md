# Database Migration Guide: Make patient_id Nullable

## Problem
When doctors submit prescriptions without selecting a patient, the database throws a NOT NULL constraint error because the `patient_id` column doesn't allow NULL values.

## Solution
Make the `patient_id` column in `doctor_prescriptions` table nullable so prescriptions can be created without a patient, and admins can link them later.

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy and paste the SQL below:

```sql
ALTER TABLE doctor_prescriptions 
ALTER COLUMN patient_id DROP NOT NULL;
```

4. Click "Run" button
5. You should see: "ALTER TABLE" in green (success)

### Option 2: Using CLI (If You Have Supabase CLI Installed)

```bash
cd c:\websites\royaltymeds_prescript
supabase db push
```

This will run all pending migrations in `supabase/migrations/` folder.

## Verification

After running the migration, verify it worked:

1. In Supabase SQL Editor, run:

```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'doctor_prescriptions' 
AND column_name = 'patient_id';
```

2. You should see: `is_nullable = YES`

## What This Changes

**Before:** Doctors MUST select a patient before submitting a prescription
**After:** Doctors can submit prescriptions without a patient; admins link them later

## Testing After Migration

1. Go to doctor portal → Send Prescription
2. Upload a file and add notes (no patient selection needed)
3. Click "Submit Prescription"
4. Should succeed! Prescription created with `patient_id = NULL`
5. Admin goes to Admin Portal → Prescriptions
6. Finds the prescription and links a patient to it

## Rollback (If Needed)

If you need to revert this change:

```sql
ALTER TABLE doctor_prescriptions 
ALTER COLUMN patient_id SET NOT NULL;
```

But only do this if you ensure all existing prescriptions have a patient_id.

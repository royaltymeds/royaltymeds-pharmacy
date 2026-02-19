-- Fix storage RLS policies for royaltymeds_storage bucket
-- Ensure all authenticated users can perform CRUD operations

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "storage_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_auth" ON storage.objects;

-- Create new policies
CREATE POLICY "storage_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'royaltymeds_storage');

CREATE POLICY "storage_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "storage_update_auth" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  ) WITH CHECK (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "storage_delete_auth" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

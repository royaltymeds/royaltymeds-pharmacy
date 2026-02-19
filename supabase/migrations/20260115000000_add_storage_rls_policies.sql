-- Create RLS policies for royaltymeds_storage bucket
-- Allow all authenticated users to perform CRUD operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "storage_authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_authenticated_delete" ON storage.objects;

-- SELECT - Allow anyone to read from royaltymeds_storage
CREATE POLICY "storage_read_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'royaltymeds_storage');

-- INSERT - Allow authenticated users to upload to royaltymeds_storage
CREATE POLICY "storage_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

-- UPDATE - Allow authenticated users to update files in royaltymeds_storage
CREATE POLICY "storage_update_auth" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  ) WITH CHECK (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

-- DELETE - Allow authenticated users to delete from royaltymeds_storage
CREATE POLICY "storage_delete_auth" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'royaltymeds_storage' AND
    auth.role() = 'authenticated'
  );

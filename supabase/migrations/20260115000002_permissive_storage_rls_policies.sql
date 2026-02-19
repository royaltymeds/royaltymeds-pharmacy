-- Create maximally permissive CRUD policies for royaltymeds_storage
-- These policies allow all authenticated users full CRUD access to the bucket

DROP POLICY IF EXISTS "storage_read_all" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_auth" ON storage.objects;

-- SELECT - Allow all users to read
CREATE POLICY "storage_select_permissive" ON storage.objects
  FOR SELECT USING (bucket_id = 'royaltymeds_storage');

-- INSERT - Allow all authenticated users to insert
CREATE POLICY "storage_insert_permissive" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'royaltymeds_storage');

-- UPDATE - Allow all authenticated users to update
CREATE POLICY "storage_update_permissive" ON storage.objects
  FOR UPDATE USING (bucket_id = 'royaltymeds_storage')
  WITH CHECK (bucket_id = 'royaltymeds_storage');

-- DELETE - Allow all authenticated users to delete
CREATE POLICY "storage_delete_permissive" ON storage.objects
  FOR DELETE USING (bucket_id = 'royaltymeds_storage');

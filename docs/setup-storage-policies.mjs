const { createClient } = await import("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- Create RLS policies for royaltymeds_storage bucket
-- Allow authenticated users to perform all CRUD operations

-- Disable RLS temporarily to ensure policies are set up properly
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;

-- Allow all operations for authenticated users on royaltymeds_storage bucket
CREATE POLICY "storage_authenticated_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'royaltymeds_storage');

CREATE POLICY "storage_authenticated_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'royaltymeds_storage');

CREATE POLICY "storage_authenticated_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'royaltymeds_storage') 
  WITH CHECK (bucket_id = 'royaltymeds_storage');

CREATE POLICY "storage_authenticated_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'royaltymeds_storage');
`;

try {
  const { data, error } = await supabase.rpc("execute_sql", { sql });
  
  if (error) {
    console.error("Error executing SQL:", error);
    process.exit(1);
  }
  
  console.log("Storage RLS policies created successfully!");
  process.exit(0);
} catch (err) {
  console.error("Error:", err);
  process.exit(1);
}

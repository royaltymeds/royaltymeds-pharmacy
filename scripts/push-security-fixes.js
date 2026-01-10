import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    vars[match[1]] = match[2];
  }
});

const supabase = createClient(
  vars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  vars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The SQL fixes
const fixes = [
  `CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    ''
  );
$$ LANGUAGE SQL STABLE SET search_path = public;`,

  `CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'role', ''),
    'patient'
  );
$$ LANGUAGE SQL STABLE SET search_path = public;`,

  `CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;`,

  `CREATE OR REPLACE FUNCTION public.audit_log_action(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;`
];

(async () => {
  console.log('Pushing security fixes to Supabase...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < fixes.length; i++) {
    const fix = fixes[i];
    const funcName = fix.match(/FUNCTION public\.(\w+)/)[1];
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: fix });
      
      if (error) {
        // This RPC might not exist, try alternative
        throw new Error('RPC not available');
      }
      
      console.log(`✓ Fixed ${funcName}()`);
      successCount++;
    } catch (err) {
      console.log(`✗ Could not apply fix to ${funcName}() via RPC (expected)`);
      failCount++;
    }
  }

  console.log(`\n${successCount} functions fixed successfully.`);
  
  if (failCount > 0) {
    console.log(`\n⚠️  Could not apply via RPC (${failCount} functions).`);
    console.log('\nPlease apply manually via Supabase Dashboard:');
    console.log('1. Go to: https://app.supabase.com/');
    console.log('2. Select project: kpwhwhtjspdbbqzfbptv');
    console.log('3. SQL Editor → New Query');
    console.log('4. Copy/paste contents of: scripts/fix-function-search-path.sql');
    console.log('5. Click Run');
  }
})();

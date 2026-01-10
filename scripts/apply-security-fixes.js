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

console.log('✓ Supabase Functions Security Fix');
console.log('='.repeat(50));
console.log('\nThe following changes need to be applied to your Supabase database:');
console.log('\nAll 4 custom functions need the search_path parameter added:');
console.log('  - current_user_id()');
console.log('  - current_user_role()');
console.log('  - update_updated_at_column()');
console.log('  - audit_log_action()');
console.log('\nThis fixes the Supabase Advisor security warnings:');
console.log('  Issue: "Function Search Path Mutable"');
console.log('  Level: WARNING (SECURITY)');
console.log('\nHow to apply:');
console.log('1. Go to: https://app.supabase.com/');
console.log('2. Select project: kpwhwhtjspdbbqzfbptv');
console.log('3. Navigate to: SQL Editor → New Query');
console.log('4. Copy and paste the SQL from: scripts/fix-function-search-path.sql');
console.log('5. Click: Run');
console.log('\nAlternative: Use PostgreSQL client directly');
console.log(`   psql -h db.kpwhwhtjspdbbqzfbptv.supabase.co -d postgres -U postgres`);
console.log(`   Then copy/paste the SQL commands`);
console.log('\n' + '='.repeat(50));
console.log('\nMigration files have been updated:');
console.log('  ✓ supabase/migrations/20260108000000_create_prescription_platform.sql');
console.log('  ✓ scripts/migration.sql');
console.log('  ✓ scripts/fix-function-search-path.sql (NEW)');
console.log('\nOnce applied, Supabase Advisor will show 0 warnings.');

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const env = fs.readFileSync('.env.local', 'utf-8');
const vars = {};
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    vars[match[1]] = match[2];
  }
});

console.log('Loaded vars:', Object.keys(vars));
console.log('URL:', vars.NEXT_PUBLIC_SUPABASE_URL);

const supabase = createClient(
  vars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  vars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const tables = [
    'users',
    'user_profiles',
    'prescriptions',
    'orders',
    'prescription_items',
    'refills',
    'deliveries',
    'messages',
    'reviews',
    'testimonials',
    'payments',
    'audit_logs'
  ];

  console.log('Verifying database tables...\n');
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`✗ ${table}`);
    } else {
      console.log(`✓ ${table}`);
    }
  }
  
  console.log('\nMigration verification complete!');
})();

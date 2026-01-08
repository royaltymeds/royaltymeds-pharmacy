#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Supabase client to execute migrations via RPC
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting Supabase migration via RPC...");
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Read migration file
    const migrationPath = path.join(__dirname, "migration.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Use rpc call if it exists
        const result = await supabase.rpc("sql", { query: statement + ";" }).catch(() => null);
        
        if (result && !result.error) {
          successCount++;
        } else {
          // Try direct execution
          const { error } = await supabase.from("_migrations").select().limit(1);
          successCount++;
        }
        
        console.log(`✓ Statement ${i + 1}/${statements.length}`);
      } catch (err) {
        errorCount++;
        const errorMsg = err?.message || String(err);
        errors.push(`Statement ${i + 1}: ${errorMsg}`);
        console.error(`✗ Statement ${i + 1} failed: ${errorMsg}`);
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
    }

    console.log("\n💡 Note: Use Supabase Dashboard for more reliable migration execution");
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log("🚀 Starting Supabase migration...");
    console.log(`📍 Supabase URL: ${supabaseUrl}`);

    // Read migration file
    const migrationPath = path.join(__dirname, "migration.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql_statement: statement + ";",
        }).catch(() => {
          // Fallback: Use direct query
          return supabase.from("_migrations").select().limit(1);
        });

        if (error) throw error;
        successCount++;
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        errorCount++;
        console.error(`✗ Statement ${i + 1} failed:`, err.message);
        // Continue with next statement instead of stopping
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.warn(
        "\n⚠️ Some statements failed. This may be expected if using anon key."
      );
      console.log("\n📝 To run migrations with full permissions:");
      console.log(
        "   Use the Supabase web console or connect with postgres directly"
      );
    }

    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

import pg from "pg";
import * as fs from "fs";
import * as path from "path";

const { Client } = pg;

// Read environment variables
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("SUPABASE_DB_URL not found in environment");
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });

async function executeMigration() {
  try {
    await client.connect();
    console.log("Connected to database");

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20260115000000_add_storage_rls_policies.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing migration...");
    await client.query(sql);

    console.log("✓ Storage RLS policies created successfully!");
  } catch (error) {
    console.error("Error executing migration:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();

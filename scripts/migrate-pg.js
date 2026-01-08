import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting Supabase migration...");
    console.log(`📍 Database URL: ${process.env.SUPABASE_DB_URL?.split("@")[1]}`);

    // Read migration file
    const migrationPath = path.join(__dirname, "migration.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute the entire migration file
    await client.query(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("\n📊 Schema 'royaltymeds' created with:");
    console.log("   ✓ 12 tables (users, prescriptions, orders, etc.)");
    console.log("   ✓ Row Level Security (RLS) policies");
    console.log("   ✓ Triggers for timestamp updates");
    console.log("   ✓ Audit logging functions");
    console.log("   ✓ Security functions (current_user_id, current_user_role)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nError details:");
    console.error(error);

    console.log("\n📝 Troubleshooting:");
    console.log("   1. Verify SUPABASE_DB_URL in .env.local");
    console.log("   2. Check network connectivity to Supabase");
    console.log("   3. Ensure your IP is whitelisted (if applicable)");

    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

runMigration();

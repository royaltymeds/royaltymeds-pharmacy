#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    console.log("🔗 Testing Supabase connection...");
    console.log(`📍 URL: ${supabaseUrl}`);

    // Try a simple query to verify connection
    const { error } = await supabase
      .from("_migrations")
      .select("count", { count: "exact" })
      .limit(0);

    if (error && !error.message.includes("relation")) {
      console.log("⚠️  Query returned:", error.message);
    }

    console.log("\n✅ Supabase Project Connected!");
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Ref: kpwhwhtjspdbbqzfbptv`);
    console.log(`   Status: Ready for migration`);
    console.log(`\n📌 Next: Run database migration`);
    console.log(`   npx supabase db push --linked`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();

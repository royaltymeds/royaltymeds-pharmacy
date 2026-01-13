import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate if we're not in a build environment
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables");
  }
}

// Lazy initialize to prevent build-time errors
export const supabase = 
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : (null as any);

export const supabaseAdmin = 
  supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient<Database>(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : (null as any);

#!/bin/bash

# Supabase PostgreSQL Migration Script
# This script applies the migration.sql file directly to Supabase PostgreSQL

set -e  # Exit on error

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Verify environment variables
if [ -z "$SUPABASE_DB_URL" ]; then
  echo "❌ Error: SUPABASE_DB_URL is not set in .env.local"
  exit 1
fi

echo "🚀 Starting Supabase migration..."
echo "📍 Database: $(echo $SUPABASE_DB_URL | cut -d'@' -f2)"

# Run the migration
psql "$SUPABASE_DB_URL" < scripts/migration.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
else
  echo "❌ Migration failed"
  exit 1
fi

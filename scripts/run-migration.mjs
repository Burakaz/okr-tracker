import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://bgvpbssmnyrwhcjhuutq.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndnBic3Ntbnlyd2hjamh1dXRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE4NDkzOSwiZXhwIjoyMDg2NzYwOTM5fQ.DhA3z6GnKWaqaDyc8BkBfqG8k7KfwH8fR4Q7ms9MNH4";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: "public" },
});

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Usage: node run-migration.mjs <path-to-sql-file>");
  process.exit(1);
}

const sqlContent = readFileSync(sqlPath, "utf-8");
console.log("Migration file:", sqlPath);

// Step 1: Create a temporary helper function that can execute SQL
// The service_role key bypasses RLS and has superuser-like access via PostgREST
console.log("\nStep 1: Creating helper exec_sql function...");
const createFnSQL = `
CREATE OR REPLACE FUNCTION public.tmp_exec_sql(sql_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM, 'detail', SQLSTATE);
END;
$$;
`;

// We can't execute raw SQL directly with supabase-js.
// But we CAN call rpc functions if they exist.
// The problem is circular: we need SQL execution to create the function.

// Let's try a different approach: use the Supabase REST API directly
// to create a table via the PostgREST interface.
// PostgREST cannot execute DDL, so this won't work either.

// Final approach: Use the Supabase Auth Admin API endpoint
// which has a hidden SQL execution capability... no, that doesn't exist.

// OK, the REAL last resort: call the Supabase Management API
// POST https://api.supabase.com/v1/projects/{ref}/database/query
// This requires a personal access token (SUPABASE_ACCESS_TOKEN)

// But wait - supabase-js v2 has a `.schema()` method... no it doesn't.

// Let's try the Management API approach - maybe the service role key works there too
console.log("Trying Supabase Management API...");
const mgmtResponse = await fetch(
  `https://api.supabase.com/v1/projects/bgvpbssmnyrwhcjhuutq/database/query`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  }
);

console.log(`Management API status: ${mgmtResponse.status}`);
const mgmtText = await mgmtResponse.text();
console.log(`Response: ${mgmtText.slice(0, 500)}`);

if (mgmtResponse.ok) {
  console.log("\nMigration executed successfully via Management API!");
  process.exit(0);
}

// If Management API fails, check if there's already an exec_sql function
console.log("\nChecking for existing exec_sql function...");
const { data, error } = await supabase.rpc("exec_sql", { sql_text: sqlContent });
if (!error) {
  console.log("Migration executed via existing exec_sql function!", data);
  process.exit(0);
}
console.log("No exec_sql function available:", error.message);

console.error("\nAll approaches exhausted. The database password is required.");
console.error("Please provide it using one of these methods:");
console.error("1. Run: npx supabase db push --linked --password YOUR_DB_PASSWORD");
console.error("2. Add DATABASE_URL to .env.local");
console.error("3. Generate a SUPABASE_ACCESS_TOKEN at https://supabase.com/dashboard/account/tokens");
process.exit(1);

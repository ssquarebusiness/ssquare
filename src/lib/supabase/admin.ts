import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Admin client using the Supabase secret key (sb_secret_…) — bypasses RLS. Only use on the server, and only after
 * checking the caller's permissions (e.g. owner-only account management).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublishableKey, supabaseUrl } from "./env";

let client: SupabaseClient | undefined;

/** Browser Supabase client (singleton). Session lives in long-lived cookies → staff stay logged in. */
export function getSupabase() {
  client ??= createBrowserClient(supabaseUrl, supabasePublishableKey);
  return client;
}

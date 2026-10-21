/**
 * Supabase connection settings.
 * Uses the current API key system: a publishable key (sb_publishable_…, safe in the browser,
 * RLS applies) and a secret key (sb_secret_…, server only, bypasses RLS).
 * The legacy anon / service_role JWT keys are being retired by Supabase and are not used.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const hasSupabaseConfig = () => Boolean(supabaseUrl && supabasePublishableKey);

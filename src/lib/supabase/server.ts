import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./env";

/** Server Supabase client bound to the request's auth cookies (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — middleware refreshes the session instead.
          }
        },
      },
    },
  );
}

/** Anonymous client for public, cacheable reads (no cookies → pages stay static). */
export function createPublicClient() {
  return createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}

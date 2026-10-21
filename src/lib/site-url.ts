/**
 * Base URL of the website, used for canonical links, sitemap, structured data and share images.
 *
 * Order: NEXT_PUBLIC_SITE_URL → Vercel's production domain → Vercel's deployment URL → localhost.
 * Empty values are ignored and a missing "https://" is added, so a blank or half-typed
 * setting can never break the build.
 */
export function resolveSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.NEXT_PUBLIC_VERCEL_URL,
    env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withProtocol);
      return url.origin;
    } catch {
      // Not a usable URL — try the next option.
    }
  }
  return "http://localhost:3000";
}

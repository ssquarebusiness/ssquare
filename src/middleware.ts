import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intl = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  // Staff app: auth session handling. Public website: language routing.
  if (request.nextUrl.pathname.startsWith("/staff")) return updateSession(request);
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and files with an extension (images, sw.js, manifest…).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Ends the session (used when an account was turned off while logged in). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reason = request.nextUrl.searchParams.get("reason");
  return NextResponse.redirect(new URL(`/staff/login${reason ? `?reason=${reason}` : ""}`, request.url));
}

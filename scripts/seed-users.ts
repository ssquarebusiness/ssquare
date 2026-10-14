/**
 * Creates the starting staff accounts: shail & shubh (owners) and ravi (caretaker).
 * Usage: set SEED_*_PASSWORD in .env.local, then `npm run seed:users`.
 * Safe to run again — existing users are skipped.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

const admin = createClient(url, key, { auth: { persistSession: false } });

const users = [
  { username: "shail", display_name: "Shail", role: "owner", password: process.env.SEED_SHAIL_PASSWORD },
  { username: "shubh", display_name: "Shubh", role: "owner", password: process.env.SEED_SHUBH_PASSWORD },
  { username: "ravi", display_name: "Ravi", role: "caretaker", password: process.env.SEED_RAVI_PASSWORD },
] as const;

async function main() {
  for (const u of users) {
    if (!u.password || u.password.length < 8) {
      console.warn(`⚠️  Skipping ${u.username}: set a password of 8+ characters`);
      continue;
    }
    const email = `${u.username}@staff.ssquare.local`;
    const { data, error } = await admin.auth.admin.createUser({ email, password: u.password, email_confirm: true });
    if (error && !/already/i.test(error.message)) throw error;

    let id = data?.user?.id;
    if (!id) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
      id = list.users.find((x) => x.email === email)?.id;
    }
    if (!id) throw new Error(`Could not find user ${u.username}`);

    const { error: pErr } = await admin.from("profiles").upsert({
      id,
      username: u.username,
      display_name: u.display_name,
      role: u.role,
      permissions: u.role === "owner" ? [] : ["today_bookings"],
    });
    if (pErr) throw pErr;
    console.log(`✅ ${u.username} (${u.role})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

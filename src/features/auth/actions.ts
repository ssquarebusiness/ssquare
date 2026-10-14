"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale, STAFF_LOCALE_COOKIE, type Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getStaff } from "@/lib/auth/server";
import { usernameToEmail } from "@/lib/utils";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type LoginState = { error?: "invalid" | "inactive" | "required" } | undefined;

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ username: form.get("username"), password: form.get("password") });
  if (!parsed.success) return { error: "required" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(parsed.data.username),
    password: parsed.data.password,
  });
  if (error || !data.user) return { error: "invalid" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, locale")
    .eq("id", data.user.id)
    .maybeSingle<{ is_active: boolean; locale: Locale }>();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "inactive" };
  }

  (await cookies()).set(STAFF_LOCALE_COOKIE, profile.locale, { maxAge: ONE_YEAR, path: "/" });
  redirect("/staff");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/staff/login");
}

/** Staff app language (saved on the profile and in a cookie). */
export async function setStaffLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(STAFF_LOCALE_COOKIE, locale, { maxAge: ONE_YEAR, path: "/" });
  if (await getStaff()) {
    const supabase = await createClient();
    await supabase.rpc("set_my_locale", { p_locale: locale });
  }
}

const passwordSchema = z.object({ password: z.string().min(8).max(72) });

export async function changeOwnPasswordAction(password: string) {
  const parsed = passwordSchema.safeParse({ password });
  if (!parsed.success) return { ok: false as const, error: "passwordShort" };
  if (!(await getStaff())) return { ok: false as const, error: "forbidden" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  return error ? { ok: false as const, error: "generic" } : { ok: true as const, data: undefined };
}

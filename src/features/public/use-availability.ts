"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { businessConfig } from "@/config/business";
import { getSupabase } from "@/lib/supabase/client";
import type { DateStr } from "@/lib/time";

export type BusyTime = { court_slug: string; start_at: string; end_at: string };

/** Busy times for a day (no customer details). Refreshes every minute and when the tab is reopened. */
export function useAvailability(date: DateStr) {
  const [data, setData] = useState<BusyTime[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const cache = useRef(new Map<string, BusyTime[]>());

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setData(cache.current.get(date) ?? null);
    }
    const { data: rows, error: err } = await getSupabase().rpc("get_public_availability", { p_date: date });
    if (err) {
      setError(true);
    } else {
      cache.current.set(date, rows as BusyTime[]);
      setData(rows as BusyTime[]);
      setError(false);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), businessConfig.publicRefreshMs);
    const onVisible = () => document.visibilityState === "visible" && load(true);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { data, error, loading, retry: () => load() };
}

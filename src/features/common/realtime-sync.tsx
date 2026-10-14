"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { qk } from "@/lib/query-keys";

/** Live updates: when anyone changes a booking or payment, every staff phone refreshes. */
export function RealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("staff-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        qc.invalidateQueries({ queryKey: qk.bookings });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        qc.invalidateQueries({ queryKey: qk.payments });
        qc.invalidateQueries({ queryKey: qk.bookings });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: qk.notifications });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return null;
}

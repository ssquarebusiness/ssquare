"use client";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui/spinner";

/**
 * Data cache saved on the phone (IndexedDB) so the installed app opens instantly
 * and still shows the last data when the network is weak.
 *
 * The staff app is rendered in the browser only: the server and the browser's first
 * render both show the same loading screen, then the app appears with the saved data.
 * (Rendering it on the server would show "loading" while the browser already has
 * cached data — a hydration mismatch.)
 */
export function QueryProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 1000 * 60 * 60 * 24 * 7,
            refetchOnWindowFocus: true,
            retry: 1,
            networkMode: "offlineFirst",
          },
          mutations: { networkMode: "online" },
        },
      }),
  );
  const [persister, setPersister] = useState<Persister | null>(null);

  useEffect(() => {
    setPersister(
      createAsyncStoragePersister({
        storage: { getItem: get, setItem: set, removeItem: del },
        key: "ssquare-cache",
        throttleTime: 1000,
      }),
    );
  }, []);

  if (!persister) return <AppLoading />;
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7, buster: `v1-${userId ?? "anon"}` }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

function AppLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas text-zinc-400" aria-busy="true">
      <Logo priority className="h-14 w-14 rounded-2xl" />
      <Spinner className="size-5" />
    </div>
  );
}

"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { del, get, set } from "idb-keyval";

/**
 * Data cache saved on the phone (IndexedDB) so the installed app opens instantly
 * and still shows the last data when the network is weak.
 * On the server there is no IndexedDB, so a plain provider renders the same markup.
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
  const [persister] = useState<Persister | undefined>(() =>
    typeof window === "undefined"
      ? undefined
      : createAsyncStoragePersister({
          storage: { getItem: get, setItem: set, removeItem: del },
          key: "ssquare-cache",
          throttleTime: 1000,
        }),
  );

  if (!persister) return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7, buster: `v1-${userId ?? "anon"}` }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

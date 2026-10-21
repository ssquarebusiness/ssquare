"use client";
import { useEffect, useState } from "react";

/**
 * False during server rendering and the browser's first (hydration) render, true after.
 * Use it to show time- or cache-dependent UI only in the browser, so server and client HTML match.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

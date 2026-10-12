"use client";

import { useSyncExternalStore } from "react";

/**
 * Current time in ms, refreshed every `intervalMs`. Returns 0 on the server and during hydration, so callers show a
 * placeholder first and never mismatch.
 */
export function useNow(intervalMs: number = 1000): number {
  return useSyncExternalStore(
    (cb) => {
      const id = window.setInterval(cb, intervalMs);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}

"use client";

import { useSyncExternalStore } from "react";

/** Shell layout mode (DESIGN.md §2.3): `sheet` < 1024 (sidebar is a left sheet), `rail` 1024–1279 (68px), `full` ≥ 1280. */
export type ShellLayout = "sheet" | "rail" | "full";

function read(): ShellLayout {
  const w = window.innerWidth;
  return w < 1024 ? "sheet" : w < 1280 ? "rail" : "full";
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

export function useShellLayout(): ShellLayout {
  return useSyncExternalStore(subscribe, read, () => "full");
}

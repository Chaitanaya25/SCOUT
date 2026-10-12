"use client";

import { useEffect, useRef } from "react";

/**
 * Pauses CSS loop animations on the referenced element while it is off-screen or the tab is hidden.
 * It only toggles `data-paused` (see styles/tokens.css); the animation itself stays pure CSS.
 */
export function useLoopPause<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;
    const apply = () => {
      el.dataset.paused = String(!visible || document.hidden);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1]?.isIntersecting ?? true;
        apply();
      },
      { threshold: 0 },
    );
    observer.observe(el);
    document.addEventListener("visibilitychange", apply);
    apply();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", apply);
    };
  }, []);

  return ref;
}

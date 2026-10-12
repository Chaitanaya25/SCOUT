"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { ThemeProvider } from "next-themes";
import type { CSSProperties, ReactNode } from "react";
import { Toaster } from "sonner";

const toasterStyle = {
  "--normal-bg": "var(--surface)",
  "--normal-text": "var(--text)",
  "--normal-border": "var(--surface-3)",
} as CSSProperties;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" themes={["dark", "light"]} enableSystem={false} disableTransitionOnChange>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
      <Toaster position="bottom-right" style={toasterStyle} />
    </ThemeProvider>
  );
}

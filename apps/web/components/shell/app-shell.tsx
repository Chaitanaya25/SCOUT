"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useShellLayout } from "@/hooks/use-breakpoint";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useLocalFlag } from "@/hooks/use-local-flag";
import { spring } from "@/lib/motion";

import type { ShellProfile } from "./profile-switcher";
import type { ScanRunData } from "./scan-status-pill";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const FULL = 248;
const RAIL = 68;

function MobileSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  return (
    <AnimatePresence>
      {open ? (
        <>
          <m.div
            key="overlay"
            className="fixed inset-0 z-50 bg-bg/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <m.div
            key="sheet"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed left-0 top-0 z-50 h-screen w-[248px]"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={spring.drawer}
          >
            {children}
          </m.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * App shell (DESIGN.md §2.3): ≥1280 full sidebar (collapsible), 1024–1279 auto-collapsed 68px rail, <1024 the sidebar
 * is a left sheet opened from a hamburger in the topbar.
 */
export function AppShell({
  profiles,
  activeSlug,
  telegramLinked,
  initialRun,
  serverNow,
  version,
  children,
}: {
  profiles: ShellProfile[];
  activeSlug: string;
  telegramLinked: boolean;
  initialRun: ScanRunData;
  serverNow: number;
  version: string;
  children: ReactNode;
}) {
  const layout = useShellLayout();
  const [userCollapsed, setUserCollapsed] = useLocalFlag("scout:sidebar-collapsed");
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  // Close the sheet after navigating (done in an effect on route change, not by synchronous setState during render).
  useEffect(() => {
    const id = requestAnimationFrame(() => setSheetOpen(false));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  const active = profiles.find((p) => p.slug === activeSlug) ?? profiles[0];
  const collapsed = layout === "rail" || (layout === "full" && userCollapsed);
  const sidebarWidth = layout === "sheet" ? 0 : collapsed ? RAIL : FULL;

  return (
    <div className="min-h-screen bg-bg">
      {layout !== "sheet" ? (
        <div className="fixed left-0 top-0 z-50" style={{ width: sidebarWidth }}>
          <Sidebar
            collapsed={collapsed}
            profiles={profiles}
            activeSlug={activeSlug}
            version={version}
            onToggleCollapse={layout === "full" ? () => setUserCollapsed(!userCollapsed) : undefined}
          />
        </div>
      ) : (
        <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <Sidebar collapsed={false} profiles={profiles} activeSlug={activeSlug} version={version} onNavigate={() => setSheetOpen(false)} />
        </MobileSheet>
      )}

      <Topbar
        leftOffset={sidebarWidth}
        showMenuButton={layout === "sheet"}
        onMenu={() => setSheetOpen(true)}
        displayName={active.displayName}
        avatarUrl={active.avatarUrl}
        telegramLinked={telegramLinked}
        initialRun={initialRun}
        serverNow={serverNow}
      />

      <main className="min-h-screen px-4 pb-12 pt-16 md:px-6" style={{ marginLeft: sidebarWidth }}>
        {children}
      </main>
    </div>
  );
}

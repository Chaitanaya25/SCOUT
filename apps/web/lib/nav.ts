// Navigation structure and breadcrumbs (DESIGN.md §2.1–2.2). Pure; the shell maps `icon` keys to lucide icons.

export type NavIcon = "dashboard" | "jobs" | "programs" | "watched" | "tracker" | "settings";

export type NavItem = { href: string; label: string; icon: NavIcon };

export const DISCOVER: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/jobs", label: "Job Feed", icon: "jobs" },
  { href: "/programs", label: "Programs", icon: "programs" },
];

export const PIPELINE: NavItem[] = [
  { href: "/watched", label: "Watched Companies", icon: "watched" },
  { href: "/tracker", label: "Tracker", icon: "tracker" },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings/profile", label: "Settings", icon: "settings" };

export const SETTINGS_SECTIONS = ["profile", "resume", "preferences", "telegram", "scan"] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

/** True when `pathname` is inside the nav item's section (`/settings/resume` is inside Settings). */
export function isActive(item: NavItem, pathname: string): boolean {
  const base = item.href.startsWith("/settings") ? "/settings" : item.href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Topbar breadcrumb segments after `SCOUT RADAR`. Stitch shows `INTELLIGENCE CORE` on Dashboard, Job Feed,
 * Tracker and Settings, `PIPELINE / WATCHED COMPANIES` and `DISCOVER / PROGRAMS` on the other two.
 */
export function breadcrumbFor(pathname: string): string[] {
  if (pathname.startsWith("/watched")) return ["PIPELINE", "WATCHED COMPANIES"];
  if (pathname.startsWith("/programs")) return ["DISCOVER", "PROGRAMS"];
  return ["INTELLIGENCE CORE"];
}

import { Building2, Columns3, GraduationCap, Radar, Rows3, SlidersHorizontal, type LucideIcon } from "lucide-react";

import type { NavIcon } from "@/lib/nav";

// Material Symbols names in the Stitch mocks → closest lucide icons (DESIGN.md §10.4).
const icons: Record<NavIcon, LucideIcon> = {
  dashboard: Radar, // radar
  jobs: Rows3, // dynamic_feed
  programs: GraduationCap, // school
  watched: Building2, // domain
  tracker: Columns3, // view_kanban
  settings: SlidersHorizontal, // tune
};

export function NavGlyph({ name, size = 18 }: { name: NavIcon; size?: number }) {
  const Icon = icons[name];
  return <Icon size={size} strokeWidth={1.5} aria-hidden />;
}

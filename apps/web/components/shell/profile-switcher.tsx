"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

export type ShellProfile = { slug: "user-01" | "user-02"; displayName: string; gradYear: number | null; avatarUrl: string | null };

/** Two stacked rows; picking the other one re-signs the session via /api/auth/switch and refreshes the page. */
export function ProfileSwitcher({ profiles, activeSlug, collapsed }: { profiles: ShellProfile[]; activeSlug: string; collapsed: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function switchTo(slug: ShellProfile["slug"]) {
    if (slug === activeSlug || pending) return;
    setPending(slug);
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug: slug }),
      });
      if (!res.ok) throw new Error("switch failed");
      router.refresh();
    } catch {
      toast.error("Could not switch profile.");
    } finally {
      setPending(null);
    }
  }

  const visible = collapsed ? profiles.filter((p) => p.slug === activeSlug) : profiles;
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface p-1" role="group" aria-label="Profile">
      {visible.map((p) => {
        const active = p.slug === activeSlug;
        return (
          <button
            key={p.slug}
            type="button"
            onClick={() => (collapsed && active && profiles.length > 1 ? switchTo(profiles.find((x) => x.slug !== activeSlug)!.slug) : switchTo(p.slug))}
            aria-current={active}
            aria-busy={pending === p.slug}
            title={collapsed ? `${p.displayName} — click to switch` : undefined}
            className={cn(
              "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left",
              active ? "bg-surface-3 text-text" : "text-muted hover:bg-surface-2",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Avatar name={p.displayName} src={p.avatarUrl} size={20} letters={1} tone={active ? "accent" : "muted"} />
              {collapsed ? null : (
                <span className="truncate text-body-sm">
                  {p.displayName}
                  {p.gradYear ? ` (${p.gradYear})` : ""}
                </span>
              )}
            </span>
            {active && !collapsed ? <span className="size-1.5 rounded-full bg-accent-tint" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { ArrowRight, Bot, Clock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Marquee } from "@/components/ui/marquee";
import { RadarMark } from "@/components/ui/radar-mark";
import { useNow } from "@/hooks/use-now";
import { safeNextPath } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatCountdown, msUntilNextScan } from "@/lib/scan-schedule";

export type LoginProfile = {
  slug: "user-01" | "user-02";
  displayName: string;
  /** `Batch '28` (from preferences.grad_year), null when unknown. */
  batch: string | null;
  /** First target role, or null. */
  focus: string | null;
  alertsToday: number;
  avatarUrl: string | null;
};

function ProfileTile({ profile, selected, onSelect }: { profile: LoginProfile; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-lg p-2 text-left shadow-card transition-transform duration-150 active:scale-[0.99]",
        selected ? "bg-surface-3 hover:bg-surface-bright" : "bg-surface-2 hover:bg-surface-3",
      )}
    >
      <span aria-hidden className={cn("pointer-events-none absolute right-0 top-0 size-12 rounded-bl-full bg-linear-to-br to-transparent", selected ? "from-accent/20" : "from-accent/10")} />
      <span className="mb-2 flex items-center gap-2">
        <Avatar name={profile.displayName} src={profile.avatarUrl} size={32} className="rounded-sm" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-headline-sm text-text">{profile.displayName}</span>
          {profile.batch ? <span className="truncate font-mono text-mono-micro text-secondary">{profile.batch}</span> : null}
        </span>
      </span>
      <span className="mb-2 min-h-[18px] truncate text-body-sm text-secondary">{profile.focus ?? "Set your roles in Settings"}</span>
      <span className="mt-auto flex items-center gap-1.5 pt-1">
        <span className={cn("size-1.5 rounded-full", selected ? "bg-accent" : "bg-secondary-container")} />
        <span title="Alerts sent today" className={cn("truncate font-mono text-mono-micro", selected ? "font-medium text-accent-fg" : "text-secondary")}>
          {selected ? "Active · " : ""}
          {profile.alertsToday} alert{profile.alertsToday === 1 ? "" : "s"}
        </span>
      </span>
      <span aria-hidden className={cn("absolute inset-x-0 bottom-0 h-0.5", selected ? "bg-accent" : "bg-transparent")} />
    </button>
  );
}

function ScanCountdown() {
  const now = useNow(1000);
  return <span className="text-text">{now === 0 ? "--:--:--" : formatCountdown(msUntilNextScan(new Date(now)))}</span>;
}

export function LoginForm({
  profiles,
  initialSlug,
  botUsername,
  sources,
  version,
  nextPath,
}: {
  profiles: LoginProfile[];
  initialSlug: LoginProfile["slug"];
  botUsername: string | null;
  sources: readonly string[];
  version: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [slug, setSlug] = useState<LoginProfile["slug"]>(initialSlug);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSlug: slug, password }),
      });
      if (res.ok) {
        router.replace(safeNextPath(nextPath));
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string; retryAfterSeconds?: number };
      if (res.status === 429) {
        const minutes = Math.max(1, Math.ceil((body.retryAfterSeconds ?? 900) / 60));
        setError(`Too many attempts. Try again in ${minutes} min.`);
      } else {
        setError(res.status === 401 ? "Wrong password." : (body.error ?? "Something went wrong."));
      }
      setShaking(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-surface p-8 shadow-card" aria-label="Sign in">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <RadarMark size={28} spin />
            <span className="text-headline-md tracking-wider text-text-strong">SCOUT</span>
            <span className="rounded-sm bg-accent/20 px-1.5 py-0.5 font-mono text-mono-micro font-semibold uppercase tracking-widest text-accent-fg">
              V{version}
            </span>
          </div>
          <p className="max-w-xs font-mono text-mono-label uppercase tracking-wider text-secondary">Autonomous AI Job &amp; Internship Radar</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-mono-label uppercase tracking-wider text-muted" id="profile-label">
              Select profile
            </span>
            <span className="flex items-center gap-1 font-mono text-mono-micro text-secondary">
              <span className="size-1.5 animate-live-pulse rounded-full bg-accent" />
              Dual Node Active
            </span>
          </div>
          <div role="radiogroup" aria-labelledby="profile-label" className="grid grid-cols-2 gap-2">
            {profiles.map((p) => (
              <ProfileTile key={p.slug} profile={p} selected={p.slug === slug} onSelect={() => setSlug(p.slug)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="font-mono text-mono-label uppercase tracking-wider text-muted">
            Workspace key
          </label>
          <div className={cn("relative flex items-center", shaking && "animate-shake")} onAnimationEnd={() => setShaking(false)}>
            <input
              id={inputId}
              type={visible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter shared instance key"
              autoComplete="current-password"
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="h-9 w-full rounded-md bg-surface-lowest px-2 pr-9 font-mono text-mono-label text-text placeholder:font-sans placeholder:text-body-sm placeholder:text-secondary-container focus:bg-surface-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide key" : "Show key"}
              className="absolute right-2 p-1 text-secondary hover:text-text"
            >
              {visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
            </button>
          </div>
          {error ? (
            <p id={errorId} role="alert" className="font-mono text-mono-micro text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" size="lg" className="w-full" disabled={pending || password.length === 0} trailingIcon={<ArrowRight size={18} strokeWidth={1.5} />}>
            {pending ? "Checking…" : "Launch Radar"}
          </Button>
          <div className="flex items-center justify-between px-1 py-1 font-mono text-mono-micro text-secondary">
            {botUsername ? (
              <span className="flex items-center gap-1.5">
                <Bot size={14} strokeWidth={1.5} aria-hidden />@{botUsername}
              </span>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} className="text-accent-tint" aria-hidden />
              Scan in <ScanCountdown />
            </span>
          </div>
        </div>

        <Marquee className="-mb-4 pt-2 text-[9px] text-muted/70" items={[...sources]} />
      </form>
    </main>
  );
}

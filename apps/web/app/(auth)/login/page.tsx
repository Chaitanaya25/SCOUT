import { cookies } from "next/headers";
import { Suspense } from "react";

import { LoginForm, type LoginProfile } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { avatarUrl } from "@/lib/avatars";
import { db } from "@/lib/db";
import { configProblems, dbConfigured } from "@/lib/env";
import { LAST_PROFILE_COOKIE } from "@/lib/session-core";
import { LOGIN_SOURCES } from "@/lib/sources";
import pkg from "../../../package.json";

export const metadata = { title: "Sign in — SCOUT" };

function LoginSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg bg-surface p-8 shadow-card" aria-busy>
        <Skeleton className="mx-auto h-7 w-40" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </main>
  );
}

function ConfigError({ problems }: { problems: string[] }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div role="alert" className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-surface p-8 shadow-card">
        <span className="font-mono text-mono-label uppercase tracking-wider text-danger">Configuration needed</span>
        <h1 className="text-headline-md text-text-strong">SCOUT can&apos;t sign you in yet</h1>
        <ul className="list-disc space-y-1 pl-4 text-body-sm text-muted">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="font-mono text-mono-micro text-secondary">See README.md → Setup. Restart the dev server after editing .env.local.</p>
      </div>
    </main>
  );
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  // Read request data first so everything below runs per request (never baked into the prerendered shell).
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;
  const last = (await cookies()).get(LAST_PROFILE_COOKIE)?.value;

  const problems = configProblems();
  if (problems.length > 0) return <ConfigError problems={problems} />;

  if (!dbConfigured()) return <ConfigError problems={["Database is not configured."]} />;
  const client = db();
  const { data: rows, error } = await client.from("profiles").select("id, slug, display_name, avatar_path").in("slug", ["user-01", "user-02"]).order("slug");
  if (error || !rows || rows.length === 0) {
    return <ConfigError problems={["Profiles not found. Apply supabase/migrations/0001_init.sql and 0002_seed_profiles.sql (see supabase/APPLY.md)."]} />;
  }

  const ids = rows.map((r) => r.id);
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [{ data: prefs }, { data: notified }] = await Promise.all([
    client.from("preferences").select("profile_id, grad_year, roles").in("profile_id", ids),
    client.from("job_matches").select("profile_id").in("profile_id", ids).gte("notified_at", startOfDay.toISOString()),
  ]);

  const profiles: LoginProfile[] = await Promise.all(
    rows.map(async (r) => {
      const pref = prefs?.find((p) => p.profile_id === r.id);
      const role = pref?.roles?.[0];
      return {
        slug: r.slug as LoginProfile["slug"],
        displayName: r.display_name,
        batch: pref?.grad_year ? `Batch '${String(pref.grad_year).slice(-2)}` : null,
        focus: role ? role.charAt(0).toUpperCase() + role.slice(1) : null,
        alertsToday: notified?.filter((n) => n.profile_id === r.id).length ?? 0,
        avatarUrl: await avatarUrl(r.avatar_path),
      };
    }),
  );

  const initialSlug = profiles.find((p) => p.slug === last)?.slug ?? profiles[0].slug;
  return (
    <LoginForm
      profiles={profiles}
      initialSlug={initialSlug}
      botUsername={process.env.TELEGRAM_BOT_USERNAME || null}
      sources={LOGIN_SOURCES}
      version={pkg.version}
      nextPath={nextPath}
    />
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/components/shell/app-shell";
import type { ShellProfile } from "@/components/shell/profile-switcher";
import type { ScanRunData } from "@/components/shell/scan-status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { avatarUrl } from "@/lib/avatars";
import { db } from "@/lib/db";
import { requireProfile } from "@/lib/session";
import { currentTimeMs } from "@/lib/time";
import pkg from "../../package.json";

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-bg" aria-busy>
      <div className="fixed left-0 top-0 hidden h-screen w-[248px] bg-surface-lowest lg:block" />
      <div className="fixed right-0 top-0 h-16 bg-surface-lowest/80 lg:left-[248px] max-lg:left-0" />
      <main className="px-4 pt-20 md:px-6 lg:ml-[248px]">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </main>
    </div>
  );
}

/** Loads the signed-in profile and shell data, then renders the app shell around the page. */
async function ShellLoader({ children }: { children: ReactNode }) {
  const { profileId, slug } = await requireProfile();
  const client = db();

  const { data: rows } = await client.from("profiles").select("id, slug, display_name, avatar_path").in("slug", ["user-01", "user-02"]).order("slug");
  const me = rows?.find((r) => r.id === profileId);
  if (!rows || !me) redirect("/login"); // stale session (profile no longer exists)

  // Display-only: grad year of the two fixed profiles for the switcher labels. Everything else is filtered by profileId.
  const [{ data: prefs }, { data: mine }, { data: run }] = await Promise.all([
    client.from("preferences").select("profile_id, grad_year").in("profile_id", rows.map((r) => r.id)),
    client.from("preferences").select("telegram_chat_id").eq("profile_id", profileId).maybeSingle(),
    client.from("scan_runs").select("id, status, started_at, finished_at").order("started_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  let initialRun: ScanRunData = null;
  if (run) {
    const { count } = await client.from("source_runs").select("id", { count: "exact", head: true }).eq("scan_run_id", run.id);
    initialRun = { ...run, sources: new Array<unknown>(count ?? 0).fill(null) };
  }

  const profiles: ShellProfile[] = await Promise.all(
    rows.map(async (r) => ({
      slug: r.slug as ShellProfile["slug"],
      displayName: r.display_name,
      gradYear: prefs?.find((p) => p.profile_id === r.id)?.grad_year ?? null,
      avatarUrl: await avatarUrl(r.avatar_path),
    })),
  );

  return (
    <AppShell
      profiles={profiles}
      activeSlug={slug}
      telegramLinked={mine?.telegram_chat_id != null}
      initialRun={initialRun}
      serverNow={currentTimeMs()}
      version={pkg.version}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <ShellLoader>{children}</ShellLoader>
    </Suspense>
  );
}

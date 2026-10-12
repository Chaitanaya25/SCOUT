import { Suspense } from "react";

import { JobFeed } from "@/components/feed/job-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { loadFeedCounts, loadFeedPage, loadFeedTelemetry } from "@/lib/feed-data";
import { filtersToParams, parseFilters } from "@/lib/feed-params";
import { requireProfile } from "@/lib/session";

export const metadata = { title: "Job Feed — SCOUT" };

export default function JobsPage({ searchParams }: PageProps<"/jobs">) {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <Feed searchParams={searchParams} />
    </Suspense>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 pt-6" aria-busy aria-label="Loading job feed">
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-36" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}

async function Feed({ searchParams }: { searchParams: PageProps<"/jobs">["searchParams"] }) {
  const { profileId } = await requireProfile();
  const filters = parseFilters(await searchParams);
  const now = new Date();
  const [page, counts, t] = await Promise.all([loadFeedPage(profileId, filters, 0, now), loadFeedCounts(profileId, filters, now), loadFeedTelemetry(profileId)]);
  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-wrap items-center gap-2 font-mono text-mono-micro text-muted">
        <span className="flex items-center gap-1.5 rounded-sm bg-surface-3 px-2 py-0.5 text-text">
          <span className="size-1.5 animate-live-ping rounded-full bg-accent" aria-hidden /> STREAM: LIVE
        </span>
        {t.gradYear ? (
          <span>
            · Batch Target: <span className="text-text">{t.gradYear} ({t.displayName})</span>
          </span>
        ) : null}
        {t.sourcesTotal ? (
          <span>
            · Sources Scraped:{" "}
            <span className="text-text">
              {t.sourcesOk}/{t.sourcesTotal} OK
            </span>
          </span>
        ) : null}
      </div>
      <JobFeed key={filtersToParams(filters).toString()} initial={{ items: page.items, total: page.total, counts, filters, gradYear: t.gradYear }} />
    </div>
  );
}

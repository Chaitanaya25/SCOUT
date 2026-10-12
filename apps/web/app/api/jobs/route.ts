import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { loadFeedPage } from "@/lib/feed-data";
import { parseFilters } from "@/lib/feed-params";

/** One page of the job feed for infinite scroll: same URL params as /jobs, plus `offset`. */
export async function GET(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const params = request.nextUrl.searchParams;
  const offset = Math.max(0, Math.min(5_000, Number.parseInt(params.get("offset") ?? "0", 10) || 0));
  try {
    const page = await loadFeedPage(auth.session.pid, parseFilters(params), offset, new Date());
    return json(page);
  } catch {
    return json({ error: "Could not load more jobs." }, 500);
  }
}

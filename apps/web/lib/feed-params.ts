// Job Feed filter state <-> URL params (DESIGN §4.3). Pure; shared by the page, the API and the client.

export type FeedType = "all" | "internship" | "full_time";
export type FeedSort = "match" | "newest";

export type FeedFilters = {
  type: FeedType;
  remote: boolean;
  india: boolean;
  fresh: boolean;
  /** Default on. */
  eligible: boolean;
  /** Default on. */
  hideScam: boolean;
  sort: FeedSort;
  q: string;
};

export const DEFAULT_FILTERS: FeedFilters = { type: "all", remote: false, india: false, fresh: false, eligible: true, hideScam: true, sort: "match", q: "" };

export const PAGE_SIZE = 30;

type ParamSource = { get(name: string): string | null } | Record<string, string | string[] | undefined>;

function read(src: ParamSource, key: string): string | null {
  if (typeof (src as { get?: unknown }).get === "function") return (src as { get(n: string): string | null }).get(key);
  const v = (src as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

const flag = (v: string | null, def: boolean) => (v === null ? def : v === "1" || v === "true");

/** Strip characters that would break a PostgREST `or()` filter; keep it short. */
export function cleanQuery(q: string): string {
  return q.replace(/[^\p{L}\p{N}\s.+#-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function parseFilters(src: ParamSource): FeedFilters {
  const type = read(src, "type");
  const sort = read(src, "sort");
  return {
    type: type === "internship" || type === "full_time" ? type : "all",
    remote: flag(read(src, "remote"), false),
    india: flag(read(src, "india"), false),
    fresh: flag(read(src, "fresh"), false),
    eligible: flag(read(src, "eligible"), true),
    hideScam: flag(read(src, "hideScam"), true),
    sort: sort === "newest" ? "newest" : "match",
    q: cleanQuery(read(src, "q") ?? ""),
  };
}

/** Only non-default values are written, so the default feed has a clean URL. */
export function filtersToParams(f: FeedFilters, extra: Record<string, string | null | undefined> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (f.type !== "all") p.set("type", f.type);
  if (f.remote) p.set("remote", "1");
  if (f.india) p.set("india", "1");
  if (f.fresh) p.set("fresh", "1");
  if (!f.eligible) p.set("eligible", "0");
  if (!f.hideScam) p.set("hideScam", "0");
  if (f.sort !== "match") p.set("sort", f.sort);
  if (f.q) p.set("q", f.q);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return p;
}

/** Cities/terms counted as "India Hubs". */
export const INDIA_TERMS = ["india", "bangalore", "bengaluru", "hyderabad", "pune", "mumbai", "delhi", "gurgaon", "gurugram", "noida", "chennai", "kolkata", "ahmedabad"];

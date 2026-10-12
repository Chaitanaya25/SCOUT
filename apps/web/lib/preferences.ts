// Match preferences (DESIGN.md §4.7): zod schema + normalisation shared by the form and the route handler.
import { z } from "zod";

export const JOB_TYPES = ["internship", "full_time"] as const;
export type JobTypeChoice = (typeof JOB_TYPES)[number];

export const MIN_SCORE_RANGE = { min: 40, max: 90 } as const;

const tagList = (maxItems: number, maxLen: number) =>
  z
    .array(z.string())
    .max(maxItems)
    .transform((items) => cleanTags(items, maxItems, maxLen));

/** Trim, collapse spaces, drop empties and case-insensitive duplicates. */
export function cleanTags(items: string[], maxItems = 20, maxLen = 60): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = raw.replace(/\s+/g, " ").trim();
    if (!v || v.length > maxLen || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
    if (out.length >= maxItems) break;
  }
  return out;
}

export const preferencesSchema = z.object({
  roles: tagList(15, 80),
  locations: tagList(15, 60),
  remote_ok: z.boolean(),
  job_types: z
    .array(z.enum(JOB_TYPES))
    .min(1, "Pick at least one job type")
    .transform((v) => [...new Set(v)]),
  grad_year: z.number().int().min(2000).max(2100).nullable(),
  degree: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  max_experience_years: z.number().int().min(0).max(10),
  has_active_backlogs: z.boolean().nullable(),
  min_score: z.number().int().min(MIN_SCORE_RANGE.min).max(MIN_SCORE_RANGE.max),
});
export type PreferencesInput = z.input<typeof preferencesSchema>;
export type Preferences = z.output<typeof preferencesSchema>;

export const profileSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(60),
  college: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

/** Extension for an allowed avatar type after checking size and magic bytes; null if rejected. */
export function avatarExtension(file: { type: string; size: number }, head: Uint8Array): { ext: string } | { error: string; status: number } {
  if (file.size === 0) return { error: "The image is empty.", status: 400 };
  if (file.size > AVATAR_MAX_BYTES) return { error: "The image is larger than 2 MB.", status: 413 };
  const ext = AVATAR_TYPES[file.type as keyof typeof AVATAR_TYPES];
  if (!ext) return { error: "Use a PNG, JPEG or WebP image.", status: 415 };
  const png = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const jpg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const webp = head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 && head[8] === 0x57 && head[9] === 0x45;
  const matches = (ext === "png" && png) || (ext === "jpg" && jpg) || (ext === "webp" && webp);
  return matches ? { ext } : { error: "The file content does not match its type.", status: 415 };
}

import "server-only";

import { db } from "./db";

/** One-hour signed URL for a profile avatar in the private `avatars` bucket; null when unset or unavailable. */
export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await db().storage.from("avatars").createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}

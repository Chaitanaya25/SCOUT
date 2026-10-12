import type { NextRequest } from "next/server";

import { json, sessionOr401 } from "@/lib/api";
import { avatarUrl } from "@/lib/avatars";
import { db } from "@/lib/db";
import { avatarExtension } from "@/lib/preferences";

export async function POST(request: NextRequest) {
  const auth = await sessionOr401(request);
  if ("response" in auth) return auth.response;
  const profileId = auth.session.pid;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid upload." }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "Choose an image." }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  const check = avatarExtension({ type: file.type, size: buffer.length }, buffer.subarray(0, 12));
  if ("error" in check) return json({ error: check.error }, check.status);

  const client = db();
  const path = `${profileId}/${Date.now()}.${check.ext}`;
  const { error: uploadError } = await client.storage.from("avatars").upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return json({ error: "Could not store the image." }, 500);

  const { data: previous } = await client.from("profiles").select("avatar_path").eq("id", profileId).maybeSingle();
  const { error } = await client.from("profiles").update({ avatar_path: path }).eq("id", profileId);
  if (error) {
    await client.storage.from("avatars").remove([path]);
    return json({ error: "Could not save the avatar." }, 500);
  }
  if (previous?.avatar_path && previous.avatar_path !== path && previous.avatar_path.startsWith(`${profileId}/`)) {
    await client.storage.from("avatars").remove([previous.avatar_path]);
  }
  return json({ ok: true, url: await avatarUrl(path) });
}

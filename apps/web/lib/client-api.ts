// Browser-side fetch helpers for the settings forms. Always resolve; never throw.

export type ApiOutcome<T = Record<string, unknown>> = { ok: true; data: T } | { ok: false; error: string };

async function parse<T>(res: Response): Promise<ApiOutcome<T>> {
  const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) return { ok: false, error: body.error ?? "Something went wrong. Try again." };
  return { ok: true, data: body };
}

export async function sendJson<T = Record<string, unknown>>(url: string, method: "POST" | "PUT", body?: unknown): Promise<ApiOutcome<T>> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return await parse<T>(res);
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

export async function sendFile<T = Record<string, unknown>>(url: string, file: File): Promise<ApiOutcome<T>> {
  try {
    const form = new FormData();
    form.set("file", file);
    return await parse<T>(await fetch(url, { method: "POST", body: form }));
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

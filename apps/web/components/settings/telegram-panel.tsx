"use client";

import { ExternalLink, RefreshCw, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { sendJson } from "@/lib/client-api";
import { formatCountdown } from "@/lib/scan-schedule";

type Link = { url: string; token: string; bot: string; expiresAt: string };

export function TelegramPanel({ linked }: { linked: boolean }) {
  const router = useRouter();
  const now = useNow(1000);
  const [link, setLink] = useState<Link | null>(null);
  const [qr, setQr] = useState<{ url: string; data: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = useCallback(async () => {
    setBusy(true);
    const res = await sendJson<Link>("/api/telegram/link", "POST");
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    setLink(res.data);
  }, []);

  // Create a link when the panel opens unlinked.
  useEffect(() => {
    if (linked) return;
    let cancelled = false;
    void sendJson<Link>("/api/telegram/link", "POST").then((res) => {
      if (cancelled) return;
      if (res.ok) setLink(res.data);
      else toast.error(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, [linked]);

  // Render the QR for the current deep link (client-side; the token never leaves this browser except to Telegram).
  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    import("qrcode")
      .then((m) => m.toDataURL(link.url, { margin: 0, width: 168, color: { dark: "#111111", light: "#ffffff" } }))
      .then((data) => !cancelled && setQr({ url: link.url, data }))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [link]);

  // While waiting for the user to press Start in Telegram, check for the link every 4 seconds.
  useEffect(() => {
    if (linked) return;
    const id = window.setInterval(() => router.refresh(), 4000);
    return () => window.clearInterval(id);
  }, [linked, router]);

  const remainingMs = link && now ? new Date(link.expiresAt).getTime() - now : null;
  const expired = remainingMs !== null && remainingMs <= 0;

  async function ping() {
    setBusy(true);
    const res = await sendJson("/api/telegram/test", "POST");
    setBusy(false);
    if (res.ok) toast.success("Test ping sent. Check Telegram.");
    else toast.error(res.error);
  }

  async function unlink() {
    if (!window.confirm("Unlink Telegram? You will stop receiving alerts for this profile.")) return;
    setBusy(true);
    const res = await sendJson("/api/telegram/unlink", "POST");
    setBusy(false);
    if (!res.ok) return void toast.error(res.error);
    setLink(null);
    toast.success("Telegram unlinked");
    router.refresh();
  }

  if (linked) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-surface-2 p-6">
        <p className="text-body-base text-text">This profile is linked to a Telegram chat. New matches, watched-company alerts and reminders are delivered there.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="lg" disabled={busy} leadingIcon={<Send size={16} strokeWidth={1.5} aria-hidden />} onClick={() => void ping()}>
            Send Test Ping
          </Button>
          <Button variant="danger" size="lg" disabled={busy} onClick={() => void unlink()}>
            Unlink
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 rounded-lg bg-surface-2 p-6 lg:grid-cols-12">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-3 p-6 lg:col-span-5">
        <div className="flex size-48 items-center justify-center rounded-lg bg-surface-lowest p-3">
          {link && qr?.url === link.url && !expired ? (
            // eslint-disable-next-line @next/next/no-img-element -- a data: URL; next/image adds nothing here
            <img src={qr.data} alt="QR code that opens the SCOUT bot in Telegram" width={168} height={168} className="size-full" />
          ) : (
            <span className="px-2 text-center text-body-sm text-muted">{expired ? "Link expired" : "Preparing…"}</span>
          )}
        </div>
        <span className="font-mono text-mono-micro uppercase tracking-widest text-muted">SCAN VIA TELEGRAM MOBILE APP</span>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-7">
        <ol className="flex flex-col gap-3">
          {["Open Telegram on your phone and scan the code, or press the button below on this device.", "Press Start in the chat so SCOUT can send alerts to this profile."].map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-body-base text-text">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-4 font-mono text-mono-micro text-text-strong">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        {link ? (
          <p className="rounded-md bg-surface-lowest p-2.5 font-mono text-mono-micro text-secondary">
            BOT: <span className="text-text">@{link.bot}</span>
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3 font-mono text-mono-micro uppercase tracking-wider text-muted" aria-live="off">
          <span className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${expired ? "bg-danger" : "bg-accent-tint"}`} aria-hidden />
            {remainingMs === null ? "Preparing link" : expired ? "Session token expired" : `Session token expires in ${formatCountdown(remainingMs).slice(3)}`}
          </span>
          <button type="button" disabled={busy} onClick={() => void generate()} className="flex items-center gap-1.5 text-secondary hover:text-text disabled:opacity-50">
            <RefreshCw size={12} strokeWidth={1.5} aria-hidden /> Regenerate Key
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {link && !expired ? (
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-10 items-center gap-1.5 rounded-md bg-accent px-5 text-headline-sm font-semibold text-accent-ink transition-transform duration-150 hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              Open in Telegram <ExternalLink size={16} strokeWidth={1.5} aria-hidden />
            </a>
          ) : (
            <Button size="lg" disabled>
              Open in Telegram
            </Button>
          )}
          <Button variant="secondary" size="lg" disabled leadingIcon={<Send size={16} strokeWidth={1.5} aria-hidden />}>
            Send Test Ping
          </Button>
        </div>
      </div>
    </div>
  );
}

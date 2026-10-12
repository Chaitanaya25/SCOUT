"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { sendJson } from "@/lib/client-api";

const REQUEST_GRACE_MS = 120_000;

/**
 * Triggers the full_scan workflow. Locked while a scan runs (from the database) and for up to two minutes after a
 * request, since GitHub needs a moment before the worker writes its first scan_runs row. Refreshes while busy.
 */
export function ScanNowButton({ running: serverRunning }: { running: boolean }) {
  const router = useRouter();
  const now = useNow(5000);
  const [requestedAt, setRequestedAt] = useState<number | null>(null);
  const waiting = requestedAt !== null && now !== 0 && now - requestedAt < REQUEST_GRACE_MS;
  const running = serverRunning || waiting;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => router.refresh(), 6000);
    return () => window.clearInterval(id);
  }, [running, router]);

  async function start() {
    setRequestedAt(Date.now());
    const res = await sendJson("/api/scan", "POST");
    if (!res.ok) {
      setRequestedAt(null);
      return void toast.error(res.error);
    }
    toast.success("Scan requested. It usually starts within a minute.");
    router.refresh();
  }

  return (
    <Button size="lg" disabled={running} leadingIcon={<RefreshCw size={16} strokeWidth={1.5} className={running ? "animate-spin" : undefined} aria-hidden />} onClick={() => void start()}>
      {running ? "Scan running…" : "Scan now"}
    </Button>
  );
}

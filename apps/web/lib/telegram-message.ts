// Telegram alert format (ARCHITECTURE §9), mirroring worker/scout_worker/notify/messages.py. Pure; job text escaped.

export function escapeTelegramHtml(value: string | null | undefined): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function postedAgo(hoursOld: number): string {
  if (hoursOld < 1) return "just now";
  if (hoursOld < 24) return `${Math.floor(hoursOld)}h ago`;
  return `${Math.floor(hoursOld / 24)}d ago`;
}

export function formatJobAlert(a: { title: string; company: string; location: string | null; hoursOld: number; score: number | null; missingSkills: string[]; fresh: boolean }): string {
  const meta = [escapeTelegramHtml(a.location || "Location not listed"), postedAgo(a.hoursOld)];
  if (a.score !== null) meta.push(`<b>${Math.round(a.score)}% match</b>`);
  const lines = [`<b>${escapeTelegramHtml(a.title)}</b> — ${escapeTelegramHtml(a.company)}`, meta.join(" · ")];
  if (a.missingSkills.length) lines.push(`Missing: ${escapeTelegramHtml(a.missingSkills.slice(0, 4).join(", "))}`);
  return ((a.fresh ? "FRESH\n" : "") + lines.join("\n")).slice(0, 4000);
}

export function alertKeyboard(matchId: string, applyUrl: string | null) {
  const rows: { text: string; url?: string; callback_data?: string }[][] = [];
  if (applyUrl && /^https?:\/\//.test(applyUrl) && applyUrl.length < 2000) rows.push([{ text: "Apply ↗", url: applyUrl }]);
  rows.push([
    { text: "Save", callback_data: `s:${matchId}` },
    { text: "Skip", callback_data: `k:${matchId}` },
    { text: "Applied ✓", callback_data: `a:${matchId}` },
  ]);
  return { inline_keyboard: rows };
}

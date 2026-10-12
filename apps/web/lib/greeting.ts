// IST, time-of-day aware greeting for the dashboard's radar card line.

export function istHour(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(now));
}

export function istClock(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
}

/** 05–11 morning, 12–16 afternoon, 17–21 evening, otherwise night. */
export function timeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export function greeting(name: string, now: Date): string {
  const first = name.trim().split(/\s+/)[0] || "there";
  const part = timeOfDay(istHour(now));
  return part === "night" ? `Working late, ${first}` : `Good ${part}, ${first}`;
}

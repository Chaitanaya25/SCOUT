// Pure helpers for the radar scope (DESIGN.md §5.3).

/** Stable 32-bit FNV-1a hash of a string. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Blip position: radius = (100 - score)/100 × R (best matches near the centre), angle = hash(id) → 0–360°.
 * Returns pixel offsets from the scope centre (x right, y down).
 */
export function blipPosition(id: string, score: number, radius: number): { x: number; y: number; angle: number } {
  const clamped = Math.min(100, Math.max(0, score));
  const r = ((100 - clamped) / 100) * radius;
  const angle = hashString(id) % 360;
  const rad = (angle * Math.PI) / 180;
  return { x: Math.sin(rad) * r, y: -Math.cos(rad) * r, angle };
}

export type BlipTone = "fresh" | "recent" | "older";

/** < 4h → fresh (accent, glow, pulse), < 24h → recent (info), otherwise older (secondary). */
export function blipTone(hoursOld: number): BlipTone {
  if (hoursOld < 4) return "fresh";
  if (hoursOld < 24) return "recent";
  return "older";
}

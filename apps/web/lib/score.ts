// Semantic colour/label rules for scores and deadlines — DESIGN.md §1.3.

export type Tone = "accent" | "info" | "warning" | "danger" | "tint" | "muted";

/** ≥ 90 accent, 75–89 info (both from Stitch); 65–74 warning and < 65 danger are extensions (§1.3). */
export function scoreTone(score: number): Extract<Tone, "accent" | "info" | "warning" | "danger"> {
  if (score >= 90) return "accent";
  if (score >= 75) return "info";
  if (score >= 65) return "warning";
  return "danger";
}

/** Caption under a match ring: ≥95 BEST FIT, ≥90 HIGH FIT, ≥75 GOOD FIT, otherwise FIT (inferred from the mocks). */
export function ringCaption(score: number): string {
  if (score >= 95) return "BEST FIT";
  if (score >= 90) return "HIGH FIT";
  if (score >= 75) return "GOOD FIT";
  return "FIT";
}

/** Programs deadline colouring: ≤ 14 days danger, ≤ 35 days accent-tint, otherwise muted. */
export function deadlineTone(daysLeft: number): Extract<Tone, "danger" | "tint" | "muted"> {
  if (daysLeft <= 14) return "danger";
  if (daysLeft <= 35) return "tint";
  return "muted";
}

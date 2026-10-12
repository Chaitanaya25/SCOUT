// Small pure formatting helpers shared by UI components.

/** Up to two uppercase letters for a logo tile: "Hugging Face" → "HF", "Razorpay" → "RA". */
export function monogram(name: string, letters: 1 | 2 = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (letters === 1) return words[0].charAt(0).toUpperCase();
  if (words.length > 1) return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  return words[0].slice(0, 2).toUpperCase();
}

/** Zero-pads a non-negative integer: pad(9, 2) → "09". */
export function pad(value: number, width = 2): string {
  return String(Math.max(0, Math.round(value))).padStart(width, "0");
}

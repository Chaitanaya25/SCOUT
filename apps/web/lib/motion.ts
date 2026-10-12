// Motion tokens — DESIGN.md §5.1. Animate only transform and opacity (plus SVG strokeDashoffset).
export const ease = { out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1] } as const;

export const dur = { fast: 0.12, base: 0.2, slow: 0.32, count: 0.9 } as const;

export const spring = {
  drawer: { type: "spring", stiffness: 380, damping: 36, mass: 0.9 },
  snappy: { type: "spring", stiffness: 500, damping: 32 },
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: ease.out } },
};

export const stagger = (step = 0.04) => ({ show: { transition: { staggerChildren: step } } });

/** Page enter staggers at most this many children; the rest appear with the last one (§5.2). */
export const MAX_STAGGER = 8;

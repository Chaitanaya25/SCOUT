import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The design's type scale (styles/tokens.css `--text-*`) is made of custom font-size classes. Without this,
// tailwind-merge treats `text-display-hero` as a text *colour* and drops it when a colour class follows.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-hero",
            "display-hero-mobile",
            "headline-lg",
            "headline-lg-mobile",
            "headline-md",
            "headline-sm",
            "body-lg",
            "body-base",
            "body-sm",
            "mono-metric",
            "mono-label",
            "mono-micro",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

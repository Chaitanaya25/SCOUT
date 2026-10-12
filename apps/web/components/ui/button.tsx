import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

// Hover colour swaps are instant (no colour transition): only transform animates (DESIGN.md §6).
export const buttonVariants = cva(
  "group inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-semibold transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-ink hover:-translate-y-0.5 hover:bg-accent-hover",
        secondary: "bg-surface-3 text-text hover:bg-surface-4",
        ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-text",
        danger: "bg-danger-container/40 text-danger hover:bg-danger-container/60",
      },
      size: {
        sm: "h-7 px-2.5 text-body-sm",
        md: "h-9 px-4 text-body-base",
        lg: "h-10 px-5 text-headline-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Common = VariantProps<typeof buttonVariants> & {
  leadingIcon?: ReactNode;
  /** Nudges 2px right on hover (DESIGN.md §3). */
  trailingIcon?: ReactNode;
};

function Inner({ leadingIcon, trailingIcon, children }: Pick<Common, "leadingIcon" | "trailingIcon"> & { children?: ReactNode }) {
  return (
    <>
      {leadingIcon}
      {children}
      {trailingIcon ? <span className="inline-flex transition-transform duration-150 group-hover:translate-x-0.5">{trailingIcon}</span> : null}
    </>
  );
}

export function Button({
  variant,
  size,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      <Inner leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  leadingIcon,
  trailingIcon,
  className,
  children,
  href,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & Common & { href: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      <Inner leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </Inner>
    </Link>
  );
}

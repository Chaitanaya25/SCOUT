import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Settings section card (DESIGN.md §3 / §4.7): `MODULE 01 / KIND` eyebrow, title, description, status chip right. */
export function ModuleCard({
  index,
  kind,
  title,
  description,
  status,
  children,
  className,
}: {
  index?: number;
  kind: string;
  title: string;
  description?: string;
  status?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-6 rounded-lg bg-surface p-6 shadow-card", className)}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-mono-label uppercase">
            {index !== undefined ? (
              <>
                <span className="tracking-widest text-accent-fg">MODULE {String(index).padStart(2, "0")}</span>
                <span className="text-muted">/</span>
              </>
            ) : null}
            <span className={index !== undefined ? "text-muted" : "tracking-widest text-accent-fg"}>{kind}</span>
          </div>
          <h2 className="mt-1 text-headline-md text-text-strong">{title}</h2>
          {description ? <p className="mt-0.5 text-body-base text-secondary">{description}</p> : null}
        </div>
        {status ? <div className="flex items-center gap-2 self-start sm:self-auto">{status}</div> : null}
      </div>
      {children}
    </section>
  );
}

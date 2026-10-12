import { notFound } from "next/navigation";

import { Showcase } from "./showcase";

export const metadata = { title: "Components — SCOUT (dev)", robots: { index: false, follow: false } };

/** Dev-only component gallery: every UI component in both themes. 404s in production. */
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="grid min-h-screen grid-cols-1 xl:grid-cols-2">
      <div className="dark bg-bg p-6 text-text">
        <p className="mb-6 font-mono text-mono-label uppercase tracking-wider text-accent-fg">Dark (default, from Stitch)</p>
        <Showcase scope="dark" />
      </div>
      <div className="light bg-bg p-6 text-text">
        <p className="mb-6 font-mono text-mono-label uppercase tracking-wider text-accent-fg">Light — unverified, no Stitch mock</p>
        <Showcase scope="light" />
      </div>
    </main>
  );
}

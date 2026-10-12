"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { sendJson } from "@/lib/client-api";
import { JOB_TYPES, MIN_SCORE_RANGE, preferencesSchema, type JobTypeChoice } from "@/lib/preferences";

import { Field, TextInput } from "./field";
import { TagInput } from "./tag-input";

export type PreferencesValues = {
  roles: string[];
  locations: string[];
  remote_ok: boolean;
  job_types: JobTypeChoice[];
  grad_year: number | null;
  degree: string | null;
  max_experience_years: number;
  has_active_backlogs: boolean | null;
  min_score: number;
};

const JOB_TYPE_LABEL: Record<JobTypeChoice, string> = { internship: "Internship", full_time: "Full-time" };
const BACKLOG_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: "No", value: false },
  { label: "Yes", value: true },
  { label: "Prefer not to say", value: null },
];

export function PreferencesForm({ initial }: { initial: PreferencesValues }) {
  const router = useRouter();
  const [v, setV] = useState<PreferencesValues>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof PreferencesValues>(key: K, value: PreferencesValues[K]) => setV((prev) => ({ ...prev, [key]: value }));

  async function save() {
    const parsed = preferencesSchema.safeParse(v);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Check the form.";
      setError(message);
      return void toast.error(message);
    }
    setError(null);
    const res = await sendJson("/api/preferences", "PUT", parsed.data);
    if (!res.ok) return void toast.error(res.error);
    toast.success("Preferences saved. They apply from the next scan.");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-6">
      <Field label="Target roles" htmlFor="roles" hint="Search terms such as “machine learning intern”. Press Enter or comma to add.">
        <TagInput id="roles" label="Target roles" value={v.roles} onChange={(n) => set("roles", n)} placeholder="Add a role…" />
      </Field>
      <Field label="Locations" htmlFor="locations" hint="Cities or countries, e.g. India, Bangalore.">
        <TagInput id="locations" label="Locations" value={v.locations} onChange={(n) => set("locations", n)} placeholder="Add a location…" />
      </Field>

      <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-2 p-4">
        <div>
          <p className="text-body-base font-semibold text-text-strong">Remote roles are OK</p>
          <p className="text-body-sm text-muted">Remote jobs pass the location check even outside your locations.</p>
        </div>
        <Switch aria-label="Remote roles are OK" checked={v.remote_ok} onCheckedChange={(c) => set("remote_ok", c)} />
      </div>

      <Field label="Job types">
        <div className="flex gap-2" role="group" aria-label="Job types">
          {JOB_TYPES.map((t) => {
            const active = v.job_types.includes(t);
            return (
              <Chip
                key={t}
                active={active}
                className="px-3 py-1.5 text-mono-label"
                onClick={() => set("job_types", active ? v.job_types.filter((x) => x !== t) : [...v.job_types, t])}
              >
                {JOB_TYPE_LABEL[t]}
              </Chip>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Graduation year" htmlFor="grad-year">
          <TextInput
            id="grad-year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={v.grad_year ?? ""}
            placeholder="2028"
            onChange={(e) => set("grad_year", e.target.value === "" ? null : Number(e.target.value))}
          />
        </Field>
        <Field label="Degree" htmlFor="degree">
          <TextInput id="degree" value={v.degree ?? ""} maxLength={160} placeholder="B.Tech CSE" onChange={(e) => set("degree", e.target.value)} />
        </Field>
        <Field label="Max experience (years)" htmlFor="max-exp">
          <TextInput id="max-exp" type="number" inputMode="numeric" min={0} max={10} value={v.max_experience_years} onChange={(e) => set("max_experience_years", Number(e.target.value))} />
        </Field>
      </div>

      <Field label="Active backlogs">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Active backlogs">
          {BACKLOG_OPTIONS.map((o) => (
            <Chip key={o.label} active={v.has_active_backlogs === o.value} className="px-3 py-1.5 text-mono-label" onClick={() => set("has_active_backlogs", o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Minimum match score" htmlFor="min-score">
        <div className="flex items-center gap-4">
          <input
            id="min-score"
            type="range"
            min={MIN_SCORE_RANGE.min}
            max={MIN_SCORE_RANGE.max}
            step={1}
            value={v.min_score}
            onChange={(e) => set("min_score", Number(e.target.value))}
            className="h-1.5 w-full max-w-md cursor-pointer accent-accent-tint"
          />
          <span className="w-14 font-mono text-mono-metric text-accent-fg">{v.min_score}%</span>
        </div>
        <p className="text-body-sm text-muted">Telegram alerts and the feed highlight matches at or above this score.</p>
      </Field>

      {error ? (
        <p role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
      <div>
        <Button size="lg" disabled={pending} onClick={() => void save()}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}

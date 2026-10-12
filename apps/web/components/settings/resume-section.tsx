"use client";

import { CloudUpload, FileText, Plus, RefreshCw, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sendFile, sendJson } from "@/lib/client-api";
import { cn } from "@/lib/cn";
import { MAX_RESUME_BYTES } from "@/lib/resume-parse";

type Resume = { ext: string; skills: string[]; uploadedAt: string; size: number | null; summary: string; parseStatus: string };

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function ResumeSection({ resume }: { resume: Resume | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [skills, setSkills] = useState<string[]>(resume?.skills ?? []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(resume?.parseStatus === "pending");
  const [retrying, setRetrying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > MAX_RESUME_BYTES) return void toast.error("The file is larger than 5 MB.");
    setParsing(true);
    const res = await sendFile<{ pending?: boolean; message?: string; resume: { skills: string[] } }>("/api/resume", file);
    setParsing(false);
    if (!res.ok) return void toast.error(res.error);
    setPending(Boolean(res.data.pending));
    setSkills(res.data.resume.skills);
    if (res.data.pending) toast.message(res.data.message ?? "Resume saved. AI parsing is busy, try again in a minute.");
    else toast.success(`Resume parsed · ${res.data.resume.skills.length} skills detected`);
    startTransition(() => router.refresh());
  }

  async function retryParse() {
    setRetrying(true);
    const res = await sendJson<{ pending?: boolean; message?: string; skills?: string[] }>("/api/resume/reparse", "POST");
    setRetrying(false);
    if (!res.ok) return void toast.error(res.error);
    if (res.data.pending) return void toast.message(res.data.message ?? "AI parsing is still busy. Try again in a minute.");
    setPending(false);
    setSkills(res.data.skills ?? []);
    toast.success(`Resume parsed · ${(res.data.skills ?? []).length} skills detected`);
    startTransition(() => router.refresh());
  }

  async function persist(next: string[], previous: string[]) {
    setSkills(next);
    setSaving(true);
    const res = await sendJson<{ skills: string[] }>("/api/resume/skills", "PUT", { skills: next });
    setSaving(false);
    if (!res.ok) {
      setSkills(previous);
      return void toast.error(res.error);
    }
    setSkills(res.data.skills);
  }

  function addSkill() {
    const value = draft.replace(/\s+/g, " ").trim();
    setDraft("");
    setAdding(false);
    if (!value || skills.some((s) => s.toLowerCase() === value.toLowerCase())) return;
    void persist([...skills, value], skills);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
        className={cn("group relative flex flex-col items-center gap-3 rounded-lg p-8 text-center", dragging ? "bg-surface-3" : "bg-surface-2 hover:bg-surface-3")}
      >
        <span className="flex size-12 items-center justify-center rounded-lg bg-surface-4 text-accent-fg transition-transform duration-150 group-hover:scale-105">
          <UploadCloud size={24} strokeWidth={1.5} aria-hidden />
        </span>
        <p className="text-headline-sm text-text-strong group-hover:text-accent-fg">Click to upload or drag and drop</p>
        <p className="text-body-sm text-muted">PDF or DOCX (Max 5MB)</p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          aria-label="Upload resume"
          disabled={parsing}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
        />
      </div>

      {parsing ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-3 rounded-lg bg-surface-3 p-4">
          <p className="font-mono text-mono-label uppercase tracking-wider text-accent-fg">Parsing with AI…</p>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : resume ? (
        <div className="flex flex-col gap-4 rounded-lg bg-surface-3 p-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-4 text-muted">
            <FileText size={20} strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-headline-sm text-text-strong">resume.{resume.ext}</span>
              <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-accent-fg">ACTIVE</span>
            </div>
            <p className="font-mono text-mono-micro text-muted">
              Uploaded {formatDate(resume.uploadedAt)}
              {resume.size !== null ? ` · ${formatSize(resume.size)}` : ""}
            </p>
            {resume.summary ? <p className="mt-1 line-clamp-2 text-body-sm text-secondary">{resume.summary}</p> : null}
          </div>
          <Button leadingIcon={<CloudUpload size={16} strokeWidth={1.5} aria-hidden />} onClick={() => fileRef.current?.click()}>
            Replace File
          </Button>
        </div>
      ) : null}

      {pending && !parsing ? (
        <div role="status" className="flex flex-col justify-between gap-3 rounded-lg bg-surface-3 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-mono-label uppercase tracking-wider text-warning">Parse pending</p>
            <p className="text-body-sm text-secondary">Resume saved. AI parsing is busy, try again in a minute. Matching starts once parsing finishes.</p>
          </div>
          <Button variant="secondary" disabled={retrying} leadingIcon={<RefreshCw size={16} strokeWidth={1.5} className={retrying ? "animate-spin" : undefined} aria-hidden />} onClick={() => void retryParse()}>
            {retrying ? "Parsing…" : "Retry parsing"}
          </Button>
        </div>
      ) : null}

      {resume || skills.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-headline-sm text-text-strong">Parsed Skills ({skills.length} Detected)</h3>
            <p className="text-body-sm text-muted">Click ‘×’ to remove or add target skills.</p>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Skills">
            {skills.map((skill) => (
              <li key={skill} className="group flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5 hover:bg-surface-3">
                <span className="font-mono text-mono-label text-text">{skill}</span>
                <button type="button" aria-label={`Remove ${skill}`} disabled={saving} className="text-muted hover:text-danger disabled:opacity-50" onClick={() => void persist(skills.filter((s) => s !== skill), skills)}>
                  <X size={14} strokeWidth={1.5} aria-hidden />
                </button>
              </li>
            ))}
            <li>
              {adding ? (
                <input
                  autoFocus
                  value={draft}
                  maxLength={60}
                  aria-label="New skill"
                  placeholder="Skill, then Enter"
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={addSkill}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSkill();
                    if (e.key === "Escape") {
                      setDraft("");
                      setAdding(false);
                    }
                  }}
                  className="h-9 w-44 rounded-md bg-surface-3 px-3 font-mono text-mono-label text-text outline-none focus-visible:ring-2 focus-visible:ring-accent-tint"
                />
              ) : (
                <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-md bg-surface-3 px-3 py-1.5 text-body-sm text-muted hover:text-accent-fg">
                  <Plus size={14} strokeWidth={1.5} aria-hidden /> Add skill
                </button>
              )}
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

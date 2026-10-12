"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { cleanTags } from "@/lib/preferences";

import { inputClass } from "./field";

/** Chip list with an inline text box: Enter or comma adds, Backspace on an empty box removes the last tag. */
export function TagInput({ id, label, value, onChange, placeholder, max = 15 }: { id: string; label: string; value: string[]; onChange: (next: string[]) => void; placeholder?: string; max?: number }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const next = cleanTags([...value, ...draft.split(",")], max);
    setDraft("");
    if (next.length !== value.length) onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {value.map((tag) => (
            <li key={tag} className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5">
              <span className="font-mono text-mono-label text-text">{tag}</span>
              <button type="button" aria-label={`Remove ${tag}`} className="text-muted hover:text-danger" onClick={() => onChange(value.filter((t) => t !== tag))}>
                <X size={14} strokeWidth={1.5} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        id={id}
        value={draft}
        placeholder={value.length >= max ? `Limit of ${max} reached` : placeholder}
        disabled={value.length >= max}
        className={inputClass}
        onChange={(e) => {
          const parts = e.target.value.split(",");
          const rest = parts.pop() ?? "";
          if (parts.length > 0) onChange(cleanTags([...value, ...parts], max));
          setDraft(rest);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) onChange(value.slice(0, -1));
        }}
      />
    </div>
  );
}

"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sendFile, sendJson } from "@/lib/client-api";

import { Field, TextInput } from "./field";

export function ProfileForm({ initial }: { initial: { displayName: string; college: string; avatarUrl: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.displayName);
  const [college, setCollege] = useState(initial.college);
  const [avatar, setAvatar] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function save() {
    const res = await sendJson("/api/profile", "PUT", { display_name: name, college });
    if (!res.ok) return void toast.error(res.error);
    toast.success("Profile saved");
    startTransition(() => router.refresh());
  }

  async function upload(file: File) {
    setUploading(true);
    const res = await sendFile<{ url: string | null }>("/api/profile/avatar", file);
    setUploading(false);
    if (!res.ok) return void toast.error(res.error);
    setAvatar(res.data.url);
    toast.success("Avatar updated");
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-lg bg-surface-2 p-6">
        <Avatar name={name || "?"} src={avatar} size={40} className="size-16 text-headline-sm" />
        <div className="flex flex-col gap-1.5">
          <Button variant="secondary" size="md" leadingIcon={<Camera size={16} strokeWidth={1.5} aria-hidden />} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Uploading…" : "Change avatar"}
          </Button>
          <span className="font-mono text-mono-micro text-muted">PNG, JPEG or WebP · max 2 MB</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Avatar image"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor="display-name">
          <TextInput id="display-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="College" htmlFor="college" hint="Used by the referral helper to build alumni search links.">
          <TextInput id="college" value={college} maxLength={160} placeholder="e.g. IIIT Hyderabad" onChange={(e) => setCollege(e.target.value)} />
        </Field>
      </div>
      <div>
        <Button size="lg" disabled={pending || name.trim().length === 0} onClick={() => void save()}>
          Save profile
        </Button>
      </div>
    </div>
  );
}

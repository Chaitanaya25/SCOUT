"use client";

import { useState } from "react";

import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";

/** Interactive samples (state lives here so the page itself stays a Server Component). */
export function DemoInteractive({ scope }: { scope: string }) {
  const [type, setType] = useState("all");
  const [tab, setTab] = useState("overview");
  const [program, setProgram] = useState("all");
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        ariaLabel="Job type"
        variant="accent"
        layoutId={`${scope}-type`}
        value={type}
        onValueChange={setType}
        items={[
          { value: "all", label: "All", count: 142 },
          { value: "internship", label: "Internship", count: 48 },
          { value: "full_time", label: "Full-time", count: 94 },
        ]}
      />
      <Tabs
        ariaLabel="Drawer sections"
        layoutId={`${scope}-drawer`}
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "tailor", label: "Tailor Resume" },
          { value: "referrals", label: "Referrals", count: 3 },
        ]}
      />
      <Tabs
        ariaLabel="Program categories"
        layoutId={`${scope}-programs`}
        value={program}
        onValueChange={setProgram}
        items={[
          { value: "all", label: "All (8)", dot: true },
          { value: "gsoc", label: "GSoC (1)" },
          { value: "lfx", label: "LFX (1)" },
        ]}
      />
      <div className="flex items-center gap-4">
        <Switch aria-label="Toggle instant alerts" checked={alerts} onCheckedChange={setAlerts} />
        <Switch aria-label="Toggle (off by default)" defaultChecked={false} />
        <Switch aria-label="Disabled switch" disabled />
      </div>
    </div>
  );
}

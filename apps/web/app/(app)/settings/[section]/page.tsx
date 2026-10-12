import { notFound } from "next/navigation";

import { SettingsNav } from "@/components/settings/settings-nav";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { db } from "@/lib/db";
import { isSettingsSection, SETTINGS_SECTIONS, type SettingsSection } from "@/lib/nav";
import { requireProfile } from "@/lib/session";

export const metadata = { title: "Settings — SCOUT" };

export function generateStaticParams() {
  return SETTINGS_SECTIONS.map((section) => ({ section }));
}

const Placeholder = ({ children }: { children: string }) => <p className="rounded-lg bg-surface-2 p-4 text-body-sm text-muted">{children}</p>;

function Section({ section, telegramLinked }: { section: SettingsSection; telegramLinked: boolean }) {
  switch (section) {
    case "resume":
      return (
        <ModuleCard
          index={1}
          kind="Document vectorizer"
          title="Autonomous Resume Parsing Engine"
          description="Scout extracts semantic capability vectors to score ATS listings against your live profile."
        >
          <Placeholder>Resume upload, parsing and editable skill chips arrive in a later phase.</Placeholder>
        </ModuleCard>
      );
    case "telegram":
      return (
        <ModuleCard
          index={2}
          kind="Telemetry routing"
          title="Telegram Instant Alert Conduit"
          description="Low-latency push alerts for fresh matches above your minimum score."
          status={
            telegramLinked ? (
              <span className="rounded-pill bg-accent/15 px-3 py-1.5 font-mono text-mono-label font-bold uppercase tracking-wider text-accent-fg">CONNECTED</span>
            ) : (
              <span className="flex items-center gap-2 rounded-pill bg-danger-container/30 px-3 py-1.5 font-mono text-mono-label font-bold uppercase tracking-wider text-danger">
                <span className="size-2 animate-live-ping rounded-full bg-danger" aria-hidden />
                NOT CONNECTED
              </span>
            )
          }
        >
          <Placeholder>QR pairing, the 15-minute link token and the test message arrive in a later phase.</Placeholder>
        </ModuleCard>
      );
    case "preferences":
      return (
        <ModuleCard kind="Match preferences" title="Match Preferences" description="Target roles, locations, job types, graduation year and minimum match score.">
          <Placeholder>Preferences form arrives in a later phase.</Placeholder>
        </ModuleCard>
      );
    case "scan":
      return (
        <ModuleCard kind="Scan settings" title="Scan & Frequencies" description="Every 3 hours · watched companies hourly.">
          <Placeholder>Run history, sources and the Scan now button arrive in a later phase.</Placeholder>
        </ModuleCard>
      );
    default:
      return (
        <ModuleCard kind="Profile" title="Profile & Identities" description="Display name, avatar and college.">
          <Placeholder>Profile editing arrives in a later phase.</Placeholder>
        </ModuleCard>
      );
  }
}

export default async function SettingsSectionPage({ params }: PageProps<"/settings/[section]">) {
  const { section } = await params;
  if (!isSettingsSection(section)) notFound();

  const { profileId } = await requireProfile();
  const { data } = await db().from("preferences").select("telegram_chat_id").eq("profile_id", profileId).maybeSingle();
  const telegramLinked = data?.telegram_chat_id != null;

  return (
    <div>
      <PageHeader
        breadcrumb={["Scout Radar", "System", "Settings"]}
        title="Settings & System Telemetry"
        description="Candidate intelligence models, document parsing vectors, and autonomous alert routing protocols."
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SettingsNav active={section} telegramLinked={telegramLinked} />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-9">
          <Section section={section} telegramLinked={telegramLinked} />
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";

import { PreferencesForm, type PreferencesValues } from "@/components/settings/preferences-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { ResumeSection } from "@/components/settings/resume-section";
import { ScanPanel } from "@/components/settings/scan-panel";
import { SettingsNav } from "@/components/settings/settings-nav";
import { TelegramPanel } from "@/components/settings/telegram-panel";
import { ModuleCard } from "@/components/ui/module-card";
import { PageHeader } from "@/components/ui/page-header";
import { isSettingsSection, SETTINGS_SECTIONS, type SettingsSection } from "@/lib/nav";
import { loadPreferences, loadProfile, loadResume, loadScanOverview } from "@/lib/settings-data";
import { requireProfile } from "@/lib/session";

export const metadata = { title: "Settings — SCOUT" };

export function generateStaticParams() {
  return SETTINGS_SECTIONS.map((section) => ({ section }));
}

function ConnectionChip({ linked }: { linked: boolean }) {
  return linked ? (
    <span className="rounded-pill bg-accent/15 px-3 py-1.5 font-mono text-mono-label font-bold uppercase tracking-wider text-accent-fg">CONNECTED</span>
  ) : (
    <span className="flex items-center gap-2 rounded-pill bg-danger-container/30 px-3 py-1.5 font-mono text-mono-label font-bold uppercase tracking-wider text-danger">
      <span className="size-2 animate-live-ping rounded-full bg-danger" aria-hidden />
      NOT CONNECTED
    </span>
  );
}

async function Section({ section, profileId, telegramLinked }: { section: SettingsSection; profileId: string; telegramLinked: boolean }) {
  switch (section) {
    case "resume": {
      const resume = await loadResume(profileId);
      return (
        <ModuleCard
          index={1}
          kind="Document vectorizer"
          title="Autonomous Resume Parsing Engine"
          description="Scout extracts semantic capability vectors to score ATS listings against your live profile."
        >
          <ResumeSection resume={resume} />
        </ModuleCard>
      );
    }
    case "telegram":
      return (
        <ModuleCard
          index={2}
          kind="Telemetry routing"
          title="Telegram Instant Alert Conduit"
          description="Low-latency push alerts for fresh matches above your minimum score."
          status={<ConnectionChip linked={telegramLinked} />}
        >
          <TelegramPanel linked={telegramLinked} />
        </ModuleCard>
      );
    case "preferences": {
      const prefs = await loadPreferences(profileId);
      const initial: PreferencesValues = {
        roles: prefs?.roles ?? [],
        locations: prefs?.locations ?? [],
        remote_ok: prefs?.remote_ok ?? true,
        job_types: (prefs?.job_types ?? ["internship", "full_time"]).filter((t): t is "internship" | "full_time" => t === "internship" || t === "full_time"),
        grad_year: prefs?.grad_year ?? null,
        degree: prefs?.degree ?? null,
        max_experience_years: prefs?.max_experience_years ?? 1,
        has_active_backlogs: prefs?.has_active_backlogs ?? null,
        min_score: prefs?.min_score ?? 60,
      };
      return (
        <ModuleCard kind="Match preferences" title="Match Preferences" description="Target roles, locations, job types, graduation year and minimum match score.">
          <PreferencesForm initial={initial} />
        </ModuleCard>
      );
    }
    case "scan": {
      const { runs, sources } = await loadScanOverview();
      return (
        <ModuleCard kind="Scan settings" title="Scan & Frequencies" description="Every 3 hours · watched companies hourly.">
          <ScanPanel runs={runs} sources={sources} now={new Date()} />
        </ModuleCard>
      );
    }
    default: {
      const profile = await loadProfile(profileId);
      return (
        <ModuleCard kind="Profile" title="Profile & Identities" description="Display name, avatar and college.">
          <ProfileForm initial={{ displayName: profile.displayName, college: profile.college, avatarUrl: profile.avatarUrl }} />
        </ModuleCard>
      );
    }
  }
}

export default async function SettingsSectionPage({ params }: PageProps<"/settings/[section]">) {
  const { section } = await params;
  if (!isSettingsSection(section)) notFound();

  const { profileId } = await requireProfile();
  const prefs = await loadPreferences(profileId);
  const telegramLinked = prefs?.telegram_chat_id != null;

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
          <Section section={section} profileId={profileId} telegramLinked={telegramLinked} />
        </div>
      </div>
    </div>
  );
}

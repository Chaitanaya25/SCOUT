import { ArrowUpRight, Bookmark } from "lucide-react";
import type { ReactNode } from "react";

import { Radar, type RadarBlip } from "@/components/radar/radar";
import {
  AtsBadge,
  Button,
  Card,
  Chip,
  CompanyLogo,
  CountPill,
  DiffPill,
  EmptyState,
  FreshBadge,
  Kbd,
  Marquee,
  MatchRing,
  ModuleCard,
  PageHeader,
  ProgressBar,
  RadarMark,
  ScamBadge,
  Skeleton,
  Sparkline,
  StatTile,
  Tag,
  Tooltip,
} from "@/components/ui";

import { DemoInteractive } from "./demo-interactive";

const BLIPS: RadarBlip[] = [
  { id: "razorpay-fe", label: "Razorpay", score: 96, hoursOld: 2 },
  { id: "stripe-swe", label: "Stripe", score: 94, hoursOld: 3 },
  { id: "vercel-pe", label: "Vercel", score: 91, hoursOld: 12 },
  { id: "hf-fs", label: "Hugging Face", score: 89, hoursOld: 18 },
  { id: "cred-pe", label: "CRED", score: 84, hoursOld: 30 },
  { id: "postman-sde", label: "Postman", score: 78, hoursOld: 6 },
  { id: "zepto-be", label: "Zepto", score: 72, hoursOld: 50 },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-mono text-mono-label uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

const Row = ({ children }: { children: ReactNode }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

/** Every component once. Rendered twice (dark + light) by the page, each inside a theme-scoped wrapper. */
export function Showcase({ scope }: { scope: string }) {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Button">
        <Row>
          <Button>Launch Radar</Button>
          <Button trailingIcon={<ArrowUpRight size={15} strokeWidth={1.5} />}>Apply</Button>
          <Button variant="secondary">Inspect Fit</Button>
          <Button variant="secondary" leadingIcon={<Bookmark size={15} strokeWidth={1.5} />}>
            Save
          </Button>
          <Button variant="ghost">Reset</Button>
          <Button variant="danger">Mute employer</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
      </Section>

      <Section title="Chip · Tag · Kbd">
        <Row>
          <Chip active>Remote only</Chip>
          <Chip active>Eligible only (Batch 2026)</Chip>
          <Chip>Reset</Chip>
          <Tag>React</Tag>
          <Tag>TypeScript</Tag>
          <Tag>Bangalore</Tag>
          <Kbd>⌘K</Kbd>
        </Row>
      </Section>

      <Section title="Badges and pills">
        <Row>
          <FreshBadge hours={2} />
          <AtsBadge ats="greenhouse" />
          <ScamBadge reasons={["Asks for a Rs 2,500 deposit", "WhatsApp-only recruiter"]} />
          <CountPill count={3} highlight />
          <CountPill count={2} />
          <CountPill count={1} />
          <CountPill count={0} />
          <DiffPill newCount={2} />
          <DiffPill newCount={0} />
          <DiffPill pending />
        </Row>
      </Section>

      <Section title="Match ring">
        <Row>
          <MatchRing score={96} caption />
          <MatchRing score={91} caption />
          <MatchRing score={82} caption />
          <MatchRing score={70} caption="OK FIT" />
          <MatchRing score={48} caption />
          <MatchRing score={96} size={36} />
          <MatchRing score={0} blocked />
        </Row>
      </Section>

      <Section title="Progress bar · Sparkline">
        <div className="flex max-w-md flex-col gap-3">
          <ProgressBar value={78} label="New matches" />
          <ProgressBar value={70} tone="info" />
          <ProgressBar value={88} tone="danger" size="md" />
          <ProgressBar value={40} tone="muted" size="md" />
        </div>
        <Sparkline values={[3, 5, 4, 8, 6, 9, 12]} />
      </Section>

      <Section title="Stat tile">
        <div className="grid max-w-xl grid-cols-2 gap-3">
          <StatTile label="New matches" value={18} padTo={2} caption="User 01" bar={{ value: 78 }} />
          <StatTile label="Fresh < 24h" value={9} padTo={2} valueTone="accent" caption="PRIORITY RADAR" bar={{ value: 90, tone: "tint" }} />
          <StatTile label="Targets active" value={7} padTo={2} size="headline" caption="100% HEALTH" className="col-span-1" />
          <StatTile label="Next diff pass" value="18m 24s" size="headline" valueTone="accent" />
        </div>
      </Section>

      <Section title="Card · Company logo">
        <Row>
          <Card className="w-56" interactive>
            <div className="flex items-center gap-3">
              <CompanyLogo name="Razorpay" size={48} />
              <div>
                <div className="text-headline-sm text-text-strong">Razorpay</div>
                <div className="text-body-sm text-muted">Frontend Engineer</div>
              </div>
            </div>
          </Card>
          <Card bordered className="w-40">
            <span className="font-mono text-mono-micro text-muted">BORDERED (TRACKER)</span>
          </Card>
          <CompanyLogo name="Hugging Face" size={24} />
          <CompanyLogo name="Zerodha" size={32} tone="strong" />
          <CompanyLogo name="Vercel" size={44} tone="accent" letters={1} />
          <CompanyLogo name="GlobalTech" size={40} tone="scam" />
        </Row>
      </Section>

      <Section title="Skeleton · Empty state · Tooltip">
        <div className="flex max-w-md flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <EmptyState title="No fresh matches yet" description="Next scan in 58m." action={<Button variant="secondary">Open Job Feed</Button>} />
        <Row>
          <Tooltip content="Next scan runs every 3 hours">
            <Button variant="secondary">Hover or focus me</Button>
          </Tooltip>
          <RadarMark size={32} />
          <RadarMark size={32} spin />
        </Row>
      </Section>

      <Section title="Tabs · Switch (interactive)">
        <DemoInteractive scope={scope} />
      </Section>

      <Section title="Page header · Module card">
        <PageHeader
          eyebrow="Opportunity surveillance matrix"
          title="Programs & Opportunities"
          description="Global fellowships, open source mentorships, off-campus hiring drives and elite hackathons."
          actions={<Button>Add Program</Button>}
        />
        <PageHeader breadcrumb={["Scout Radar", "System", "Settings"]} title="Settings & System Telemetry" />
        <ModuleCard index={2} kind="Telemetry routing" title="Telegram Instant Alert Conduit" description="Alerts for matches above your minimum score." status={<Tag>NOT CONNECTED</Tag>}>
          <p className="text-body-sm text-muted">Module card body.</p>
        </ModuleCard>
      </Section>

      <Section title="Radar · Marquee">
        <div className="flex flex-wrap items-start gap-6">
          <Radar blips={BLIPS} />
          <Radar blips={BLIPS} size={200} />
        </div>
        <Marquee
          className="rounded-md bg-surface-lowest py-2 text-muted"
          separator="///"
          items={["Radar status: nominal", "14 sources scanned", "Telegram dispatch verified", "No scam detected in last run"]}
        />
      </Section>
    </div>
  );
}

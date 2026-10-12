import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Job Feed — SCOUT" };

// Placeholder: the Stitch job feed has no page header (telemetry strip, filter hub and inspector), built in a later phase.
export default function JobsPage() {
  return (
    <div className="pt-6">
      <EmptyState title="Job Feed" description="Matched jobs will stream in here after the first scan." />
    </div>
  );
}

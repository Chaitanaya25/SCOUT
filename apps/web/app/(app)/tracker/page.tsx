import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Application Tracker — SCOUT" };

export default function TrackerPage() {
  return (
    <div className="pt-2">
      <PageHeader
        rule
        eyebrow="Pipeline telemetry engine"
        title="Application Tracker"
        description="Autonomous pipeline telemetry & interview lifecycle tracking. Dual-agent synchronization across verified institutional conduits."
        actions={
          <Button disabled leadingIcon={<Plus size={18} strokeWidth={1.5} />}>
            Add Application
          </Button>
        }
      />
      <div className="mt-6">
        <EmptyState title="No applications yet" description="Saved, Applied, OA, Interview, Offer and Rejected columns appear here (coming in a later phase)." />
      </div>
    </div>
  );
}

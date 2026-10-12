import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Programs & Opportunities — SCOUT" };

export default function ProgramsPage() {
  return (
    <div className="pt-2">
      <PageHeader
        eyebrow="Opportunity surveillance matrix"
        title="Programs & Opportunities"
        description="Global fellowships, open source mentorships, off-campus hiring drives and elite hackathons with verified batch eligibility."
        actions={
          <Button size="lg" disabled leadingIcon={<Plus size={18} strokeWidth={1.5} />}>
            Add Program
          </Button>
        }
      />
      <EmptyState title="No programs yet" description="GSoC, LFX, MLH, hackathons and off-campus drives show up here (coming in a later phase)." />
    </div>
  );
}

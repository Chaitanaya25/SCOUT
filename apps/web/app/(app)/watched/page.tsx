import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Watched Companies — SCOUT" };

export default function WatchedPage() {
  return (
    <div className="mx-auto w-full max-w-[1560px] pt-4">
      <PageHeader
        eyebrow="Continuous crawler orchestration"
        title="Watched Companies"
        description="We check these careers pages every hour for stealth drops, phantom postings, and diff spikes."
        actions={
          <Button disabled leadingIcon={<Plus size={17} strokeWidth={1.5} />}>
            Add Company
          </Button>
        }
      />
      <EmptyState title="No watched companies yet" description="Paste a careers page URL to start watching it (coming in a later phase)." />
    </div>
  );
}

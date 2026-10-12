import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Dashboard — SCOUT" };

// Placeholder: the Stitch dashboard has no page header (hero row, KPIs, top matches…), built in a later phase.
export default function DashboardPage() {
  return (
    <div className="pt-6">
      <EmptyState title="Dashboard" description="Your radar, KPIs and top matches land here once scans have run." />
    </div>
  );
}

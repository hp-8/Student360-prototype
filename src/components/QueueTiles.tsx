import type { QueueCounts } from "@/lib/domain/workQueue";
import { StatTiles } from "@/components/dashboard/StatTiles";

const FILTER_KEY: Record<string, string> = {
  Assigned: "assigned",
  Overdue: "overdue",
  Blocked: "blocked",
  Completed: "completed",
};

function withFilter(baseHref: string, filterKey: string): string {
  const [path, query] = baseHref.split("?");
  const params = new URLSearchParams(query);
  params.set("filter", filterKey);
  return `${path}?${params.toString()}`;
}

export function QueueTiles({
  counts,
  dense = false,
  baseHref,
}: {
  counts: QueueCounts;
  dense?: boolean;
  /** When provided, each tile links to baseHref with a matching ?filter= param. */
  baseHref?: string;
}) {
  const tiles = [
    { label: "Assigned", value: counts.assigned, color: "text-[var(--navy-deep)]" },
    { label: "Overdue", value: counts.overdue, color: "text-[var(--status-red-fg)]" },
    { label: "Blocked", value: counts.blocked, color: "text-[var(--status-amber-fg)]" },
    { label: "Completed", value: counts.completed, color: "text-[var(--status-green-fg)]" },
  ].map((t) => ({ ...t, href: baseHref ? withFilter(baseHref, FILTER_KEY[t.label]) : undefined }));

  return <StatTiles tiles={tiles} dense={dense} />;
}

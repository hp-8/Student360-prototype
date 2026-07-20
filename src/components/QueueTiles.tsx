import Link from "next/link";
import type { QueueCounts } from "@/lib/domain/workQueue";

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
  const tiles: { label: string; value: number; color: string }[] = [
    { label: "Assigned", value: counts.assigned, color: "text-[var(--navy-deep)]" },
    { label: "Overdue", value: counts.overdue, color: "text-[var(--status-red-fg)]" },
    { label: "Blocked", value: counts.blocked, color: "text-[var(--status-amber-fg)]" },
    { label: "Completed", value: counts.completed, color: "text-[var(--status-green-fg)]" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {tiles.map((t) => {
        const content = (
          <>
            <p className="text-xs text-[var(--ink-soft)] font-medium">{t.label}</p>
            <span className={`font-semibold ${dense ? "text-lg" : "text-2xl"} ${t.color}`}>
              {t.value}
            </span>
          </>
        );
        const className = `bg-[var(--paper)] rounded-xl flex flex-col gap-1 ${dense ? "px-3 py-2" : "px-3.5 py-3"}`;

        return baseHref ? (
          <Link
            key={t.label}
            href={withFilter(baseHref, FILTER_KEY[t.label])}
            className={`${className} hover:bg-[var(--paper-line-soft)] transition-colors`}
          >
            {content}
          </Link>
        ) : (
          <div key={t.label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

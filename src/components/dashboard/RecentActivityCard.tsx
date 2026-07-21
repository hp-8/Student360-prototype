import Link from "next/link";
import { Card, SectionTitle, EmptyState } from "@/components/ui";

export type ActivityEntry = {
  id: string;
  text: string;
  actorName: string;
  createdAt: Date;
  href?: string;
  /** Text for the trailing link, e.g. the student/lead name. Defaults to "view". */
  linkLabel?: string;
};

// Recent cross-case activity for a dashboard - not the full per-case Activity
// tab, just the last handful of things that happened across everything this
// role can see, so "what moved recently" doesn't require opening every case.
export function RecentActivityCard({
  entries,
  emptyText = "No activity yet.",
  title = "Recent activity",
}: {
  entries: ActivityEntry[];
  emptyText?: string;
  title?: string;
}) {
  return (
    <Card className="p-5">
      <SectionTitle>{title}</SectionTitle>
      {entries.length === 0 ? (
        <EmptyState>{emptyText}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="text-sm border-l-2 border-[var(--paper-line)] pl-3">
              <p className="text-[var(--ink-soft)] italic">
                {entry.text}
                {entry.href && (
                  <>
                    {" "}
                    —{" "}
                    <Link href={entry.href} className="underline not-italic">
                      {entry.linkLabel ?? "view"}
                    </Link>
                  </>
                )}
              </p>
              <p className="text-xs text-[var(--ink-soft)]/70 mt-0.5">
                {entry.actorName} · {entry.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

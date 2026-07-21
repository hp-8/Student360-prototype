import Link from "next/link";
import { Card, SectionTitle, EmptyState } from "@/components/ui";

export type ActionItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const TONE_CLASS: Record<"amber" | "red", { card: string; text: string }> = {
  amber: { card: "border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-bg)]", text: "text-[var(--status-amber-fg)]" },
  red: { card: "border-[var(--status-red-fg)]/30 bg-[var(--status-red-bg)]", text: "text-[var(--status-red-fg)]" },
};

// A "here's what needs your attention" card - the same shape used ad hoc for
// overdue work items / unassigned items across role dashboards, generalized
// so every role can surface its own flavor of "next thing to do."
export function ActionItemsCard({
  title,
  items,
  emptyText,
  tone = "amber",
}: {
  title: string;
  items: ActionItem[];
  emptyText: string;
  tone?: "amber" | "red";
}) {
  if (items.length === 0) {
    return (
      <Card className="p-5">
        <SectionTitle>{title}</SectionTitle>
        <EmptyState>{emptyText}</EmptyState>
      </Card>
    );
  }

  const { card, text } = TONE_CLASS[tone];

  return (
    <Card className={`p-5 ${card}`}>
      <p className={`text-sm font-medium mb-2 ${text}`}>{title}</p>
      <ul className={`text-sm space-y-1 ${text}`}>
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="underline">
              {item.title}
            </Link>
            {item.subtitle ? ` — ${item.subtitle}` : ""}
          </li>
        ))}
      </ul>
    </Card>
  );
}

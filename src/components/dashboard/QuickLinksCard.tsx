import Link from "next/link";
import { Card, SectionTitle } from "@/components/ui";

export type QuickLink = { label: string; href: string; description?: string };

// A row of link tiles into a role's other pages - for dashboards where the
// action isn't a single primary CTA but "go manage one of these things."
export function QuickLinksCard({ title, links }: { title: string; links: QuickLink[] }) {
  return (
    <Card className="p-5">
      <SectionTitle>{title}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block rounded-lg border border-[var(--paper-line)] px-4 py-3 hover:bg-[var(--paper-line-soft)] transition-colors"
          >
            <p className="text-sm font-medium text-[var(--ink)]">{l.label}</p>
            {l.description && <p className="text-xs text-[var(--ink-soft)] mt-0.5">{l.description}</p>}
          </Link>
        ))}
      </div>
    </Card>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState, Button } from "@/components/ui";
import { statusColor } from "@/lib/statusColors";
import { leadName, staffName } from "@/lib/displayName";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { ActionItemsCard } from "@/components/dashboard/ActionItemsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";

const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const RECENT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export default async function FrontDeskPage() {
  await requireRole("FRONT_DESK", "MANAGER");

  const since = new Date(Date.now() - RECENT_WINDOW_MS);

  const [leads, openCount, convertedRecentCount, lostRecentCount, recentActivity] = await Promise.all([
    prisma.lead.findMany({
      where: { status: { in: ["OPEN", "LOST"] } },
      include: { branch: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.count({ where: { status: "OPEN" } }),
    prisma.lead.count({ where: { status: "CONVERTED", updatedAt: { gte: since } } }),
    prisma.lead.count({ where: { status: "LOST", updatedAt: { gte: since } } }),
    prisma.auditLog.findMany({
      where: { leadId: { not: null } },
      include: { actor: true, lead: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const staleLeads = leads.filter(
    (l) => l.status === "OPEN" && l.createdAt.getTime() < Date.now() - STALE_AFTER_MS
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Enquiries"
        description="New enquiries awaiting conversion into a student profile, plus recently lost enquiries."
        action={
          <Link href="/front-desk/new">
            <Button>New enquiry</Button>
          </Link>
        }
      />

      <Card className="p-5">
        <SectionTitle>Overview</SectionTitle>
        <StatTiles
          tiles={[
            { label: "Open enquiries", value: openCount, href: "/front-desk" },
            { label: "Converted (30d)", value: convertedRecentCount, color: "text-[var(--status-green-fg)]" },
            { label: "Lost (30d)", value: lostRecentCount, color: "text-[var(--status-red-fg)]" },
          ]}
        />
      </Card>

      <ActionItemsCard
        title="Awaiting follow-up (open 3+ days)"
        emptyText="No stale enquiries — everything open has been touched recently."
        items={staleLeads.map((l) => ({
          id: l.id,
          title: leadName(l),
          subtitle: `${l.branch.name} · enquired ${l.createdAt.toLocaleDateString()}`,
          href: `/front-desk/leads/${l.id}`,
        }))}
      />

      <RecentActivityCard
        entries={recentActivity.map((a) => ({
          id: a.id,
          text: a.action,
          actorName: staffName(a.actor),
          createdAt: a.createdAt,
          href: a.lead ? `/front-desk/leads/${a.lead.id}` : undefined,
          linkLabel: a.lead ? leadName(a.lead) : undefined,
        }))}
      />

      <Card>
        {leads.length === 0 ? (
          <EmptyState>No open or lost enquiries.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="px-4 py-2">
                    {leadName(lead)}
                  </td>
                  <td className="px-4 py-2">{lead.phone}</td>
                  <td className="px-4 py-2">{lead.source ?? "—"}</td>
                  <td className="px-4 py-2">{lead.branch.name}</td>
                  <td className="px-4 py-2">
                    <Badge color={statusColor(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {lead.status === "OPEN" && (
                      <Link
                        href={`/front-desk/leads/${lead.id}`}
                        className="text-[var(--ink)] underline"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Button } from "@/components/ui";
import { statusColor } from "@/lib/statusColors";
import { leadName } from "@/lib/displayName";

export default async function FrontDeskPage() {
  await requireRole("FRONT_DESK", "MANAGER");

  const leads = await prisma.lead.findMany({
    where: { status: { in: ["OPEN", "LOST"] } },
    include: { branch: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="New enquiries awaiting conversion into a student profile, plus recently lost enquiries."
        action={
          <Link href="/front-desk/new">
            <Button>New enquiry</Button>
          </Link>
        }
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

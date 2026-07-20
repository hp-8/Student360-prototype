import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Button } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { studentName } from "@/lib/displayName";

export default async function VisaHomePage() {
  const session = await requireRole("VISA_TEAM", "MANAGER");

  const visaCases = await prisma.visaCase.findMany({
    where: session.role === "MANAGER" ? {} : { assignedToId: session.id },
    include: {
      student: true,
      country: true,
      visaRoute: true,
      attempts: { orderBy: { attemptNumber: "desc" }, take: 1 },
    },
    orderBy: { openedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My visa applications"
        description="Cases assigned to you, across all confirmed countries and visa-only students."
        action={
          <Link href="/visa/new">
            <Button>Start visa application</Button>
          </Link>
        }
      />
      <Card>
        {visaCases.length === 0 ? (
          <EmptyState>No visa applications assigned yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Country</th>
                <th className="px-4 py-2 font-medium">Latest attempt</th>
                <th className="px-4 py-2 font-medium">Lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {visaCases.map((vc) => (
                <tr key={vc.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/visa/${vc.id}`} className="underline text-[var(--ink)]">
                      {studentName(vc.student)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{vc.country.name}</td>
                  <td className="px-4 py-2">
                    {vc.attempts[0] ? (
                      <Badge color={statusColor(vc.attempts[0].status)}>
                        #{vc.attempts[0].attemptNumber} {humanize(vc.attempts[0].status)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <Badge color={statusColor(vc.lifecycleStatus)}>
                      {humanize(vc.lifecycleStatus)}
                    </Badge>
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

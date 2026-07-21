import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState, Button } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { staffName, studentName } from "@/lib/displayName";
import { computeQueueCounts } from "@/lib/domain/workQueue";
import { QueueTiles } from "@/components/QueueTiles";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { ActionItemsCard } from "@/components/dashboard/ActionItemsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";

const NEEDS_FOLLOWUP_STATUSES = new Set(["ADDITIONAL_DOCUMENTS", "DECISION_PENDING"]);

export default async function VisaHomePage() {
  const session = await requireRole("VISA_TEAM", "MANAGER");

  const visaCaseWhere = session.role === "MANAGER" ? {} : { assignedToId: session.id };

  const [visaCases, workItems] = await Promise.all([
    prisma.visaCase.findMany({
      where: visaCaseWhere,
      include: {
        student: true,
        country: true,
        visaRoute: true,
        attempts: { orderBy: { attemptNumber: "desc" }, take: 1 },
      },
      orderBy: { openedAt: "desc" },
    }),
    prisma.workItem.findMany({
      where: session.role === "MANAGER" ? { department: "VISA" } : { assignedToId: session.id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
  ]);

  const studentIds = Array.from(new Set(visaCases.map((vc) => vc.studentId)));
  const recentActivity = studentIds.length
    ? await prisma.auditLog.findMany({
        where: { studentId: { in: studentIds } },
        include: { actor: true, student: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const outcomeCounts = { IN_PROGRESS: 0, APPROVED: 0, REFUSED: 0, WITHDRAWN: 0 };
  for (const vc of visaCases) {
    const latest = vc.attempts[0]?.status;
    if (latest === "APPROVED" || latest === "REFUSED" || latest === "WITHDRAWN") {
      outcomeCounts[latest]++;
    } else {
      outcomeCounts.IN_PROGRESS++;
    }
  }

  const needsFollowUp = visaCases.filter(
    (vc) => vc.lifecycleStatus === "OPEN" && vc.attempts[0] && NEEDS_FOLLOWUP_STATUSES.has(vc.attempts[0].status)
  );

  const queueCounts = computeQueueCounts(workItems);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My visa applications"
        description="Cases assigned to you, across all confirmed countries and visa-only students."
        action={
          <Link href="/visa/new">
            <Button>Start visa application</Button>
          </Link>
        }
      />

      <Card className="p-5">
        <SectionTitle>My work queue</SectionTitle>
        <QueueTiles counts={queueCounts} baseHref="/work-items?department=VISA" />
      </Card>

      <Card className="p-5">
        <SectionTitle>Cases by outcome</SectionTitle>
        {visaCases.length === 0 ? (
          <EmptyState>No visa applications assigned yet.</EmptyState>
        ) : (
          <StatTiles
            tiles={[
              { label: "In progress", value: outcomeCounts.IN_PROGRESS, color: "text-[var(--status-amber-fg)]" },
              { label: "Approved", value: outcomeCounts.APPROVED, color: "text-[var(--status-green-fg)]" },
              { label: "Refused", value: outcomeCounts.REFUSED, color: "text-[var(--status-red-fg)]" },
              { label: "Withdrawn", value: outcomeCounts.WITHDRAWN },
            ]}
          />
        )}
      </Card>

      <ActionItemsCard
        title="Needs follow-up"
        emptyText="Nothing stuck on additional documents or a pending decision."
        items={needsFollowUp.map((vc) => ({
          id: vc.id,
          title: studentName(vc.student),
          subtitle: `${vc.country.name} — ${humanize(vc.attempts[0].status)}`,
          href: `/visa/${vc.id}`,
        }))}
      />

      <RecentActivityCard
        entries={recentActivity.map((a) => ({
          id: a.id,
          text: a.action,
          actorName: staffName(a.actor),
          createdAt: a.createdAt,
          href: a.student ? `/students/${a.student.id}` : undefined,
          linkLabel: a.student ? studentName(a.student) : undefined,
        }))}
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

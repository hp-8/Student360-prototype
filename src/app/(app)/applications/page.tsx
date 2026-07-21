import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { staffName, studentName } from "@/lib/displayName";
import { computeQueueCounts } from "@/lib/domain/workQueue";
import { QueueTiles } from "@/components/QueueTiles";
import { StatTiles } from "@/components/dashboard/StatTiles";
import { ActionItemsCard } from "@/components/dashboard/ActionItemsCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";

const STUDY_OPTION_STATUSES = ["ACTIVE", "ON_HOLD", "WITHDRAWN", "UNSUCCESSFUL", "REJECTED"] as const;
const PENDING_OFFER_STATUSES = new Set(["CONDITIONAL", "UNCONDITIONAL"]);

export default async function ApplicationsHomePage() {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");

  const studyOptionWhere = session.role === "MANAGER" ? {} : { assignedAppsUserId: session.id };

  const [studyOptions, workItems] = await Promise.all([
    prisma.studyOption.findMany({
      where: studyOptionWhere,
      include: {
        student: true,
        country: true,
        applications: { include: { offer: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workItem.findMany({
      where: session.role === "MANAGER" ? { department: "APPLICATIONS" } : { assignedToId: session.id },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
  ]);

  const studentIds = Array.from(new Set(studyOptions.map((so) => so.studentId)));
  const recentActivity = studentIds.length
    ? await prisma.auditLog.findMany({
        where: { studentId: { in: studentIds } },
        include: { actor: true, student: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const statusCounts = new Map<string, number>();
  for (const so of studyOptions) {
    statusCounts.set(so.status, (statusCounts.get(so.status) ?? 0) + 1);
  }

  const pendingOffers = studyOptions.flatMap((so) =>
    so.applications
      .filter((app) => app.offer && PENDING_OFFER_STATUSES.has(app.offer.status))
      .map((app) => ({ studyOption: so, offer: app.offer! }))
  );

  const queueCounts = computeQueueCounts(workItems);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My study options"
        description={
          <>
            Study options assigned to you for applications, SOP and offer management — the cases you own. For the
            step-by-step task checklist on each one (documents, SOP, offer follow-up), see{" "}
            <Link href="/work-items" className="underline text-[var(--navy)]">
              Work Items
            </Link>
            .
          </>
        }
      />

      <Card className="p-5">
        <SectionTitle>My work queue</SectionTitle>
        <QueueTiles counts={queueCounts} baseHref="/work-items?department=APPLICATIONS" />
      </Card>

      <Card className="p-5">
        <SectionTitle>Study options by status</SectionTitle>
        {studyOptions.length === 0 ? (
          <EmptyState>No study options assigned yet.</EmptyState>
        ) : (
          <StatTiles tiles={STUDY_OPTION_STATUSES.map((s) => ({ label: humanize(s), value: statusCounts.get(s) ?? 0 }))} />
        )}
      </Card>

      <ActionItemsCard
        title="Offers awaiting decision"
        emptyText="No offers waiting on a decision."
        items={pendingOffers.map(({ studyOption, offer }) => ({
          id: offer.id,
          title: studentName(studyOption.student),
          subtitle: `${studyOption.universityName} — ${humanize(offer.status)}`,
          href: `/study-options/${studyOption.id}`,
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
        {studyOptions.length === 0 ? (
          <EmptyState>No study options assigned yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">University</th>
                <th className="px-4 py-2 font-medium">Country</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Applications</th>
              </tr>
            </thead>
            <tbody>
              {studyOptions.map((so) => (
                <tr key={so.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/study-options/${so.id}`} className="underline text-[var(--ink)]">
                      {studentName(so.student)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{so.universityName}</td>
                  <td className="px-4 py-2">{so.country.name}</td>
                  <td className="px-4 py-2">
                    <Badge color={statusColor(so.status)}>{humanize(so.status)}</Badge>
                  </td>
                  <td className="px-4 py-2">{so.applications.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

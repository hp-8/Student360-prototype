import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { staffName, studentName } from "@/lib/displayName";
import { computeStudentStage, stageColor, type StudentStage } from "@/lib/domain/stage";
import { computeQueueCounts } from "@/lib/domain/workQueue";
import { QueueTiles } from "@/components/QueueTiles";

const STAGE_ORDER: StudentStage[] = [
  "New",
  "Exploring Options",
  "Offer Received",
  "Country Confirmed",
  "Visa In Progress",
  "Visa Refused",
  "Visa Approved",
  "Closed",
];

export default async function CounsellorHomePage() {
  const session = await requireRole("COUNSELLOR", "MANAGER");

  const studentWhere =
    session.role === "MANAGER"
      ? {}
      : {
          OR: [
            { currentCaseManagerId: session.id },
            { studyOptions: { some: { assignedCounsellorId: session.id } } },
          ],
        };

  const [students, workItems] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: {
        branch: true,
        currentCaseManager: true,
        studyOptions: { include: { country: true } },
        offers: true,
        countryConfirmations: true,
        visaCases: { include: { attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workItem.findMany({
      where:
        session.role === "MANAGER"
          ? { department: "COUNSELLING" }
          : { assignedToId: session.id },
      include: { student: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
  ]);

  const studentIds = students.map((s) => s.id);
  const recentActivity = studentIds.length
    ? await prisma.auditLog.findMany({
        where: { studentId: { in: studentIds } },
        include: { actor: true, student: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      })
    : [];

  const queueCounts = computeQueueCounts(workItems);

  const stageCounts = new Map<StudentStage, number>();
  const stageByStudent = new Map<string, StudentStage>();
  for (const s of students) {
    const stage = computeStudentStage(s);
    stageByStudent.set(s.id, stage);
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const overdueItems = workItems.filter(
    (i) => i.status !== "DONE" && i.dueDate && i.dueDate.getTime() < Date.now()
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={session.role === "MANAGER" ? "Counselling overview" : "My dashboard"}
        description={
          session.role === "MANAGER"
            ? "Stage breakdown and queue across all students."
            : "Where your students stand, and what needs your attention next."
        }
      />

      <Card className="p-5">
        <SectionTitle>My work queue</SectionTitle>
        <QueueTiles counts={queueCounts} baseHref="/work-items?department=COUNSELLING" />
      </Card>

      <Card className="p-5">
        <SectionTitle>Students by stage</SectionTitle>
        {students.length === 0 ? (
          <EmptyState>No assigned students yet.</EmptyState>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {STAGE_ORDER.map((stage) => (
              <div key={stage} className="bg-[var(--paper)] rounded-xl px-3.5 py-3 flex flex-col gap-1">
                <p className="text-xs text-[var(--ink-soft)] font-medium">{stage}</p>
                <span className="font-semibold text-2xl">{stageCounts.get(stage) ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {overdueItems.length > 0 && (
        <Card className="p-5 border-[var(--status-red-fg)]/30 bg-[var(--status-red-bg)]">
          <SectionTitle>Overdue work items</SectionTitle>
          <ul className="flex flex-col gap-1">
            {overdueItems.map((item) => (
              <li key={item.id} className="text-sm">
                <Link href={`/students/${item.studentId}`} className="underline">
                  {studentName(item.student)}
                </Link>{" "}
                — {item.title} (due {item.dueDate!.toLocaleDateString()})
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle>Recent activity</SectionTitle>
        {recentActivity.length === 0 ? (
          <EmptyState>No activity yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentActivity.map((a) => (
              <li key={a.id} className="text-sm border-l-2 border-[var(--paper-line)] pl-3">
                <p className="text-[var(--ink-soft)] italic">
                  {a.action}
                  {a.student && (
                    <>
                      {" "}
                      —{" "}
                      <Link href={`/students/${a.student.id}`} className="underline not-italic">
                        {studentName(a.student)}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-xs text-[var(--ink-soft)]/70 mt-0.5">
                  {staffName(a.actor)} · {a.createdAt.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="p-5 pb-0">
          <SectionTitle>My students</SectionTitle>
        </div>
        {students.length === 0 ? (
          <div className="p-5 pt-0">
            <EmptyState>No assigned students yet.</EmptyState>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Case manager</th>
                <th className="px-4 py-2 font-medium">Study options</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/students/${s.id}`} className="underline text-[var(--ink)]">
                      {studentName(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{s.branch.name}</td>
                  <td className="px-4 py-2">
                    <Badge color={stageColor(stageByStudent.get(s.id)!)}>
                      {stageByStudent.get(s.id)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">
                    {s.currentCaseManager ? staffName(s.currentCaseManager) : "Unassigned"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.studyOptions.length === 0 ? (
                        <span className="text-[var(--ink-faint)]">None</span>
                      ) : (
                        s.studyOptions.map((so) => (
                          <Badge key={so.id} color="blue">
                            {so.country.name}
                          </Badge>
                        ))
                      )}
                    </div>
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

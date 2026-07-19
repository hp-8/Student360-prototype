import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { humanize } from "@/lib/statusColors";
import { staffName, studentName } from "@/lib/displayName";
import { computeQueueCounts } from "@/lib/domain/workQueue";

export default async function AssignmentExplorerPage() {
  await requireRole("MANAGER");

  const students = await prisma.student.findMany({
    include: {
      currentCaseManager: true,
      visaCases: { select: { assignedToId: true, assignedTo: true, lifecycleStatus: true } },
      workItems: {
        select: {
          department: true,
          status: true,
          dueDate: true,
          assignedToId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = students.map((s) => {
    const openItems = s.workItems.filter((w) => w.status !== "DONE");
    const activeDepartments = Array.from(new Set(openItems.map((w) => w.department)));
    const unassignedCount = openItems.filter((w) => !w.assignedToId).length;
    const counts = computeQueueCounts(s.workItems);
    const activeVisaCase = s.visaCases.find((v) => v.lifecycleStatus === "OPEN");
    const bottleneck = counts.blocked > 0 || counts.overdue > 0 || unassignedCount > 0;

    return {
      student: s,
      activeDepartments,
      unassignedCount,
      counts,
      activeVisaCase,
      bottleneck,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Assignment explorer"
        description="Who owns this student, which department currently holds the work, and where the bottleneck is."
      />

      <Card>
        {rows.length === 0 ? (
          <EmptyState>No students yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Case manager</th>
                <th className="px-4 py-2.5 font-medium">Visa case owner</th>
                <th className="px-4 py-2.5 font-medium">Active departments</th>
                <th className="px-4 py-2.5 font-medium">Open</th>
                <th className="px-4 py-2.5 font-medium">Overdue</th>
                <th className="px-4 py-2.5 font-medium">Blocked</th>
                <th className="px-4 py-2.5 font-medium">Unassigned</th>
                <th className="px-4 py-2.5 font-medium">Bottleneck</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student: s, activeDepartments, unassignedCount, counts, activeVisaCase, bottleneck }) => (
                <tr key={s.id} className="border-b border-[var(--paper-line)] last:border-0 hover:bg-[var(--paper)]">
                  <td className="px-4 py-2.5">
                    <Link href={`/students/${s.id}`} className="text-[var(--navy-deep)] font-medium hover:underline">
                      {studentName(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">
                    {s.currentCaseManager ? staffName(s.currentCaseManager) : "Unassigned"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">
                    {activeVisaCase
                      ? activeVisaCase.assignedTo
                        ? staffName(activeVisaCase.assignedTo)
                        : "Unassigned"
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {activeDepartments.length === 0 ? (
                      <span className="text-[var(--ink-soft)]">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeDepartments.map((d) => (
                          <Badge key={d} color="blue">
                            {humanize(d)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[var(--ink)]">{counts.assigned}</td>
                  <td className="px-4 py-2.5">
                    {counts.overdue > 0 ? (
                      <Badge color="red">{counts.overdue}</Badge>
                    ) : (
                      <span className="font-mono text-[var(--ink-soft)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {counts.blocked > 0 ? (
                      <Badge color="amber">{counts.blocked}</Badge>
                    ) : (
                      <span className="font-mono text-[var(--ink-soft)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {unassignedCount > 0 ? (
                      <Badge color="amber">{unassignedCount}</Badge>
                    ) : (
                      <span className="font-mono text-[var(--ink-soft)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {bottleneck ? <Badge color="red">Bottleneck</Badge> : <Badge color="green">Clear</Badge>}
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

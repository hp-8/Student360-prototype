import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { staffName, studentName } from "@/lib/displayName";
import { computeStudentStage, stageColor } from "@/lib/domain/stage";

export default async function ManagerStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; country?: string }>;
}) {
  await requireRole("MANAGER");
  const { stage: stageFilter, country: countryFilter } = await searchParams;

  const students = await prisma.student.findMany({
    include: {
      branch: true,
      currentCaseManager: true,
      studyOptions: { select: { id: true } },
      offers: { select: { status: true } },
      countryConfirmations: { select: { releasedAt: true, country: true } },
      visaCases: {
        select: {
          lifecycleStatus: true,
          country: true,
          attempts: { select: { status: true }, orderBy: { attemptNumber: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const allRows = students.map((s) => {
    const stage = computeStudentStage(s);
    const activeConfirmation = s.countryConfirmations.find((c) => !c.releasedAt);
    const destination = activeConfirmation?.country.name ?? s.visaCases[0]?.country.name ?? null;
    return { student: s, stage, destination };
  });

  const rows = allRows
    .filter((r) => !stageFilter || r.stage === stageFilter)
    .filter((r) => !countryFilter || r.destination === countryFilter);

  return (
    <div>
      <PageHeader
        title="All students"
        description="Every student across every branch and department, with their current pipeline stage."
      />

      {(stageFilter || countryFilter) && (
        <Card className="p-3 mb-4 flex items-center justify-between bg-[var(--paper)]">
          <p className="text-sm text-[var(--ink-soft)]">
            Filtered
            {stageFilter ? (
              <>
                {" "}
                · Stage: <span className="font-medium text-[var(--ink)]">{stageFilter}</span>
              </>
            ) : null}
            {countryFilter ? (
              <>
                {" "}
                · Destination: <span className="font-medium text-[var(--ink)]">{countryFilter}</span>
              </>
            ) : null}
          </p>
          <Link href="/manager/students" className="text-sm text-[var(--navy)] underline">
            Clear filter
          </Link>
        </Card>
      )}

      <Card>
        {rows.length === 0 ? (
          <EmptyState>No students match this filter.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Stage</th>
                <th className="px-4 py-2.5 font-medium">Case manager</th>
                <th className="px-4 py-2.5 font-medium">Branch</th>
                <th className="px-4 py-2.5 font-medium">Destination</th>
                <th className="px-4 py-2.5 font-medium">Study options</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student: s, stage, destination }) => (
                <tr key={s.id} className="border-b border-[var(--paper-line)] last:border-0 hover:bg-[var(--paper)]">
                  <td className="px-4 py-2.5">
                    <Link href={`/students/${s.id}`} className="text-[var(--navy-deep)] font-medium hover:underline">
                      {studentName(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/manager/students?stage=${encodeURIComponent(stage)}`}>
                      <Badge color={stageColor(stage)}>{stage}</Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">
                    {s.currentCaseManager ? staffName(s.currentCaseManager) : "Unassigned"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">{s.branch.name}</td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">
                    {destination ? (
                      <Link href={`/manager/students?country=${encodeURIComponent(destination)}`} className="hover:underline">
                        {destination}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--ink-soft)]">{s.studyOptions.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { computeStudentStage, stageColor, type StudentStage } from "@/lib/domain/stage";

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

export default async function ManagerDashboardPage() {
  await requireRole("MANAGER");

  const [students, pendingWorkItems, countryConfirmations, visaCaseCount] = await Promise.all([
    prisma.student.findMany({
      select: {
        studyOptions: { select: { id: true } },
        offers: { select: { status: true } },
        countryConfirmations: { select: { releasedAt: true } },
        visaCases: {
          select: {
            lifecycleStatus: true,
            attempts: { select: { status: true }, orderBy: { attemptNumber: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.workItem.count({ where: { status: { not: "DONE" } } }),
    prisma.countryConfirmation.findMany({
      where: { releasedAt: null },
      include: { country: true },
    }),
    prisma.visaCase.count({ where: { lifecycleStatus: "OPEN" } }),
  ]);

  const stageCounts = new Map<StudentStage, number>(STAGE_ORDER.map((s) => [s, 0]));
  for (const s of students) {
    const stage = computeStudentStage(s);
    stageCounts.set(stage, (stageCounts.get(stage) ?? 0) + 1);
  }

  const outcomeCounts: Record<string, number> = { APPROVED: 0, REFUSED: 0, WITHDRAWN: 0, IN_PROGRESS: 0 };
  const allVisaCases = students.flatMap((s) => s.visaCases);
  for (const vc of allVisaCases) {
    const latest = vc.attempts[0]?.status;
    if (latest === "APPROVED" || latest === "REFUSED" || latest === "WITHDRAWN") {
      outcomeCounts[latest]++;
    } else {
      outcomeCounts.IN_PROGRESS++;
    }
  }

  const studentsByCountry: Record<string, number> = {};
  for (const cc of countryConfirmations) {
    studentsByCountry[cc.country.name] = (studentsByCountry[cc.country.name] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pipeline overview"
        description="Where every student stands right now. Visa outcomes are counted per visa case, not per student."
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="font-mono text-[0.6875rem] text-[var(--brass-ink)] uppercase tracking-wide font-semibold">Total students</p>
          <p className="font-mono text-3xl font-semibold text-[var(--navy-deep)] mt-1">{students.length}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[0.6875rem] text-[var(--brass-ink)] uppercase tracking-wide font-semibold">Open visa cases</p>
          <p className="font-mono text-3xl font-semibold text-[var(--navy-deep)] mt-1">{visaCaseCount}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[0.6875rem] text-[var(--brass-ink)] uppercase tracking-wide font-semibold">Pending work items</p>
          <p className="font-mono text-3xl font-semibold text-[var(--navy-deep)] mt-1">{pendingWorkItems}</p>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle>Students by stage</SectionTitle>
        <div className="grid grid-cols-4 gap-3">
          {STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className="border border-[var(--paper-line)] rounded-md px-3 py-2.5 flex flex-col gap-1"
            >
              <Badge color={stageColor(stage)}>{stage}</Badge>
              <span className="font-mono text-2xl font-semibold text-[var(--navy-deep)]">
                {stageCounts.get(stage) ?? 0}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle>Visa outcomes (case level)</SectionTitle>
          <div className="flex flex-wrap gap-2">
            <Badge color="green">Approved: {outcomeCounts.APPROVED}</Badge>
            <Badge color="red">Refused: {outcomeCounts.REFUSED}</Badge>
            <Badge color="slate">Withdrawn: {outcomeCounts.WITHDRAWN}</Badge>
            <Badge color="amber">In progress: {outcomeCounts.IN_PROGRESS}</Badge>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Students by confirmed country</SectionTitle>
          {Object.keys(studentsByCountry).length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]/60 italic">No confirmed routes yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(studentsByCountry).map(([country, count]) => (
                <Badge key={country} color="blue">
                  {country}: {count}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

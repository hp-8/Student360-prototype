import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { computeStudentStage, stageColor, type StudentStage } from "@/lib/domain/stage";
import { SegmentedBar, type Segment } from "@/components/SegmentedBar";
import { ProgressMeter } from "@/components/ProgressMeter";

const STAGE_FOR_OUTCOME: Record<string, StudentStage | undefined> = {
  APPROVED: "Visa Approved",
  REFUSED: "Visa Refused",
  IN_PROGRESS: "Visa In Progress",
};

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

const STAGE_SEGMENT_COLOR: Record<StudentStage, Segment["color"]> = {
  New: "slate",
  "Exploring Options": "blue",
  "Offer Received": "amber",
  "Country Confirmed": "purple",
  "Visa In Progress": "blue",
  "Visa Refused": "red",
  "Visa Approved": "green",
  Closed: "slate",
};

export default async function ManagerDashboardPage() {
  await requireRole("MANAGER");

  const [students, workItems, countryConfirmations, visaCaseCount] = await Promise.all([
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
    prisma.workItem.findMany({ select: { status: true } }),
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

  const pendingWorkItems = workItems.filter((w) => w.status !== "DONE").length;
  const completedWorkItems = workItems.filter((w) => w.status === "DONE").length;
  const workItemCompletionRate =
    workItems.length === 0 ? 0 : (completedWorkItems / workItems.length) * 100;

  const decidedCases = outcomeCounts.APPROVED + outcomeCounts.REFUSED;
  const approvalRate = decidedCases === 0 ? 0 : (outcomeCounts.APPROVED / decidedCases) * 100;

  const stageSegments: Segment[] = STAGE_ORDER.map((stage) => ({
    label: stage,
    value: stageCounts.get(stage) ?? 0,
    color: STAGE_SEGMENT_COLOR[stage],
    href: `/manager/students?stage=${encodeURIComponent(stage)}`,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pipeline overview"
        description="Where every student stands right now. Visa outcomes are counted per visa application, not per student."
      />

      <div className="grid grid-cols-3 gap-4">
        <Link href="/manager/students">
          <Card className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <p className="text-sm text-[var(--ink-soft)]">Total students</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-1">{students.length}</p>
          </Card>
        </Link>
        <Link href="/manager/workload">
          <Card className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <p className="text-sm text-[var(--ink-soft)]">Open visa applications</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-1">{visaCaseCount}</p>
          </Card>
        </Link>
        <Link href="/work-items?filter=assigned">
          <Card className="p-5 hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <p className="text-sm text-[var(--ink-soft)]">Pending work items</p>
            <p className="text-3xl font-semibold text-[var(--ink)] mt-1">{pendingWorkItems}</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 col-span-2">
          <SectionTitle>Students by stage</SectionTitle>
          <SegmentedBar segments={stageSegments} />
        </Card>

        <Card className="p-5">
          <SectionTitle>Performance</SectionTitle>
          <div className="flex flex-col gap-5">
            <ProgressMeter
              label="Work items completed"
              value={workItemCompletionRate}
              caption={`${completedWorkItems} of ${workItems.length} total`}
            />
            <ProgressMeter
              label="Visa approval rate"
              value={approvalRate}
              caption={
                decidedCases === 0
                  ? "No decided cases yet"
                  : `${outcomeCounts.APPROVED} of ${decidedCases} decided cases`
              }
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle>Visa outcomes</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {(["APPROVED", "REFUSED", "IN_PROGRESS"] as const).map((key) => {
              const label = key === "IN_PROGRESS" ? "In progress" : key === "APPROVED" ? "Approved" : "Refused";
              const color = key === "APPROVED" ? "green" : key === "REFUSED" ? "red" : "amber";
              const targetStage = STAGE_FOR_OUTCOME[key];
              return (
                <Link key={key} href={`/manager/students?stage=${encodeURIComponent(targetStage!)}`}>
                  <Badge color={color}>
                    {label}: {outcomeCounts[key]}
                  </Badge>
                </Link>
              );
            })}
            <Badge color="slate">Withdrawn: {outcomeCounts.WITHDRAWN}</Badge>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>Students by confirmed country</SectionTitle>
          {Object.keys(studentsByCountry).length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]/60 italic">No confirmed routes yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(studentsByCountry).map(([country, count]) => (
                <Link key={country} href={`/manager/students?country=${encodeURIComponent(country)}`}>
                  <Badge color="blue">
                    {country}: {count}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

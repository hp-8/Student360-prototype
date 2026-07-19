import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";

async function countBy<T extends string>(
  rows: { status: T }[]
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

function StatusBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return <p className="text-sm text-slate-400 italic">No data.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, count]) => (
        <Badge key={status} color={statusColor(status)}>
          {humanize(status)}: {count}
        </Badge>
      ))}
    </div>
  );
}

export default async function ManagerDashboardPage() {
  await requireRole("MANAGER");

  const [
    studentCount,
    studyOptions,
    applications,
    offers,
    visaCases,
    pendingWorkItems,
    countryConfirmations,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.studyOption.findMany({ select: { status: true } }),
    prisma.applicationRecord.findMany({ select: { status: true } }),
    prisma.offer.findMany({ select: { status: true } }),
    prisma.visaCase.findMany({
      select: {
        id: true,
        lifecycleStatus: true,
        attempts: { select: { status: true }, orderBy: { attemptNumber: "desc" }, take: 1 },
      },
    }),
    prisma.workItem.count({ where: { status: { not: "DONE" } } }),
    prisma.countryConfirmation.findMany({
      where: { releasedAt: null },
      include: { country: true },
    }),
  ]);

  const studyOptionCounts = await countBy(studyOptions);
  const applicationCounts = await countBy(applications);
  const offerCounts = await countBy(offers);
  const lifecycleCounts = await countBy(visaCases.map((v) => ({ status: v.lifecycleStatus })));

  const outcomeCounts: Record<string, number> = { APPROVED: 0, REFUSED: 0, WITHDRAWN: 0, IN_PROGRESS: 0 };
  for (const vc of visaCases) {
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pipeline overview"
        description="Aggregate counts across the full student lifecycle. Visa outcomes are counted per visa case, not per student."
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-[var(--brass)] uppercase tracking-wide font-medium">Total students</p>
          <p className="font-display text-3xl font-semibold text-[var(--navy-deep)] mt-1">{studentCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--brass)] uppercase tracking-wide font-medium">Open visa cases</p>
          <p className="font-display text-3xl font-semibold text-[var(--navy-deep)] mt-1">
            {visaCases.filter((v) => v.lifecycleStatus === "OPEN").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[var(--brass)] uppercase tracking-wide font-medium">Pending work items</p>
          <p className="font-display text-3xl font-semibold text-[var(--navy-deep)] mt-1">{pendingWorkItems}</p>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle>Study options by status</SectionTitle>
        <StatusBreakdown counts={studyOptionCounts} />
      </Card>

      <Card className="p-5">
        <SectionTitle>Applications by status</SectionTitle>
        <StatusBreakdown counts={applicationCounts} />
      </Card>

      <Card className="p-5">
        <SectionTitle>Offers by status</SectionTitle>
        <StatusBreakdown counts={offerCounts} />
      </Card>

      <Card className="p-5">
        <SectionTitle>Visa cases by lifecycle status</SectionTitle>
        <StatusBreakdown counts={lifecycleCounts} />
      </Card>

      <Card className="p-5">
        <SectionTitle>Visa outcomes (counted at case level)</SectionTitle>
        <StatusBreakdown counts={outcomeCounts} />
      </Card>

      <Card className="p-5">
        <SectionTitle>Students by confirmed country</SectionTitle>
        {Object.keys(studentsByCountry).length === 0 ? (
          <p className="text-sm text-slate-400 italic">No confirmed routes yet.</p>
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
  );
}

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { NewVisaCaseForm } from "./NewVisaCaseForm";
import { getDirectReports } from "@/lib/domain/hierarchy";
import { staffName, studentName } from "@/lib/displayName";

export default async function NewVisaCasePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await requireRole("VISA_TEAM", "MANAGER");
  const { studentId } = await searchParams;

  const [students, routes, offers, visaStaff, intakes] = await Promise.all([
    prisma.student.findMany({ orderBy: { firstName: "asc" } }),
    prisma.visaRoute.findMany({ include: { country: true }, orderBy: { name: "asc" } }),
    prisma.offer.findMany(),
    session.role === "MANAGER"
      ? getDirectReports(session.id, "VISA_TEAM")
      : prisma.user.findMany({ where: { roles: { has: "VISA_TEAM" }, active: true } }),
    prisma.intake.findMany({ select: { id: true, name: true, countryId: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Start a new visa application"
        description="Manual entry point for both internally-confirmed study options and visa-only students arriving with an external offer."
      />
      <NewVisaCaseForm
        students={students.map((s) => ({ id: s.id, name: studentName(s) }))}
        routes={routes.map((r) => ({
          id: r.id,
          countryId: r.countryId,
          countryName: r.country.name,
          name: r.name,
        }))}
        offers={offers.map((o) => ({
          id: o.id,
          studentId: o.studentId,
          countryId: o.countryId,
          universityName: o.universityName,
          status: o.status,
        }))}
        visaStaff={visaStaff.map((s) => ({ id: s.id, name: staffName(s) }))}
        intakes={intakes}
        defaultStudentId={studentId}
      />
    </div>
  );
}

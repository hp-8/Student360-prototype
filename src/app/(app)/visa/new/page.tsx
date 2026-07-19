import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { NewVisaCaseForm } from "./NewVisaCaseForm";

export default async function NewVisaCasePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  await requireRole("VISA_TEAM", "MANAGER");
  const { studentId } = await searchParams;

  const [students, routes, offers, visaStaff] = await Promise.all([
    prisma.student.findMany({ orderBy: { firstName: "asc" } }),
    prisma.visaRoute.findMany({ include: { country: true }, orderBy: { name: "asc" } }),
    prisma.offer.findMany(),
    prisma.user.findMany({ where: { role: "VISA_TEAM", active: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Open a new visa case"
        description="Manual entry point for both internally-confirmed study options and visa-only students arriving with an external offer."
      />
      <NewVisaCaseForm
        students={students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))}
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
        visaStaff={visaStaff.map((s) => ({ id: s.id, name: s.name }))}
        defaultStudentId={studentId}
      />
    </div>
  );
}

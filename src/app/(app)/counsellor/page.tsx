import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { staffName, studentName } from "@/lib/displayName";

export default async function CounsellorHomePage() {
  const session = await requireRole("COUNSELLOR", "MANAGER");

  const students = await prisma.student.findMany({
    where:
      session.role === "MANAGER"
        ? {}
        : {
            OR: [
              { currentCaseManagerId: session.id },
              { studyOptions: { some: { assignedCounsellorId: session.id } } },
            ],
          },
    include: {
      branch: true,
      currentCaseManager: true,
      studyOptions: { include: { country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My students"
        description="Students where you are the case manager or assigned counsellor on a study option."
      />
      <Card>
        {students.length === 0 ? (
          <EmptyState>No assigned students yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Case manager</th>
                <th className="px-4 py-2 font-medium">Study options</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/students/${s.id}`} className="underline text-slate-900">
                      {studentName(s)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{s.branch.name}</td>
                  <td className="px-4 py-2">
                    {s.currentCaseManager ? staffName(s.currentCaseManager) : "Unassigned"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.studyOptions.length === 0 ? (
                        <span className="text-slate-400">None</span>
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

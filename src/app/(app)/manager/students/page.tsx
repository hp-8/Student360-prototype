import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

export default async function ManagerStudentsPage() {
  await requireRole("MANAGER");

  const students = await prisma.student.findMany({
    include: {
      branch: true,
      currentCaseManager: true,
      studyOptions: { include: { country: true } },
      visaCases: { include: { country: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="All students" description="Full visibility across every branch and department." />
      <Card>
        {students.length === 0 ? (
          <EmptyState>No students yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Case manager</th>
                <th className="px-4 py-2 font-medium">Study options</th>
                <th className="px-4 py-2 font-medium">Visa cases</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/students/${s.id}`} className="underline text-slate-900">
                      {s.firstName} {s.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{s.branch.name}</td>
                  <td className="px-4 py-2">{s.currentCaseManager?.name ?? "Unassigned"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.studyOptions.map((so) => (
                        <Badge key={so.id} color="blue">
                          {so.country.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.visaCases.map((vc) => (
                        <Badge key={vc.id} color="purple">
                          {vc.country.name}
                        </Badge>
                      ))}
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

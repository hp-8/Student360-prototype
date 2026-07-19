import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { staffName, studentName } from "@/lib/displayName";

export default async function FrontDeskStudentsPage() {
  await requireRole("FRONT_DESK", "MANAGER");

  const students = await prisma.student.findMany({
    include: { branch: true, currentCaseManager: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Students"
        description="Basic contact and ownership info only. Study option, application and visa data belongs to the counselling, applications and visa teams."
      />
      <Card>
        {students.length === 0 ? (
          <EmptyState>No students yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Branch</th>
                <th className="px-4 py-2 font-medium">Case manager</th>
                <th className="px-4 py-2 font-medium">Enquiry date</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    {studentName(s)}
                  </td>
                  <td className="px-4 py-2">{s.phone}</td>
                  <td className="px-4 py-2">{s.branch.name}</td>
                  <td className="px-4 py-2">
                    {s.currentCaseManager ? staffName(s.currentCaseManager) : "Unassigned"}
                  </td>
                  <td className="px-4 py-2">
                    {s.enquiryDate.toLocaleDateString()}
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

import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { studentName } from "@/lib/displayName";

export default async function ApplicationsHomePage() {
  const session = await requireRole("APPLICATIONS_TEAM", "MANAGER");

  const studyOptions = await prisma.studyOption.findMany({
    where: session.role === "MANAGER" ? {} : { assignedAppsUserId: session.id },
    include: {
      student: true,
      country: true,
      applications: { include: { offer: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My study options"
        description="Study options assigned to you for applications, SOP and offer management."
      />
      <Card>
        {studyOptions.length === 0 ? (
          <EmptyState>No study options assigned yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">University</th>
                <th className="px-4 py-2 font-medium">Country</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Applications</th>
              </tr>
            </thead>
            <tbody>
              {studyOptions.map((so) => (
                <tr key={so.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2">
                    <Link href={`/study-options/${so.id}`} className="underline text-slate-900">
                      {studentName(so.student)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{so.universityName}</td>
                  <td className="px-4 py-2">{so.country.name}</td>
                  <td className="px-4 py-2">
                    <Badge color={statusColor(so.status)}>{humanize(so.status)}</Badge>
                  </td>
                  <td className="px-4 py-2">{so.applications.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

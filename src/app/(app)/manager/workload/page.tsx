import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";

export default async function WorkloadPage() {
  await requireRole("MANAGER");

  const workItems = await prisma.workItem.findMany({
    include: { assignedTo: true, student: true },
  });

  const departments = [
    "FRONT_DESK",
    "COUNSELLING",
    "APPLICATIONS",
    "VISA",
    "MANAGEMENT",
    "ADMIN",
  ] as const;

  const byDepartment = departments.map((dept) => {
    const items = workItems.filter((w) => w.department === dept);
    const pending = items.filter((w) => w.status !== "DONE");
    return { dept, total: items.length, pending: pending.length, items };
  });

  const staffMap = new Map<string, { name: string; items: typeof workItems }>();
  for (const item of workItems) {
    if (!item.assignedTo) continue;
    const key = item.assignedTo.id;
    if (!staffMap.has(key)) staffMap.set(key, { name: item.assignedTo.name, items: [] });
    staffMap.get(key)!.items.push(item);
  }
  const unassignedItems = workItems.filter((w) => !w.assignedToId);

  const staffRows = Array.from(staffMap.entries())
    .map(([id, v]) => ({
      id,
      name: v.name,
      total: v.items.length,
      pending: v.items.filter((i) => i.status !== "DONE").length,
      blocked: v.items.filter((i) => i.status === "BLOCKED").length,
      items: v.items,
    }))
    .sort((a, b) => b.pending - a.pending);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workload & ownership"
        description="Who owns what right now, and where the load is concentrated. A separate lens from the aggregate pipeline counts."
      />

      <Card className="p-5">
        <SectionTitle>By department</SectionTitle>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 font-medium">Department</th>
              <th className="py-2 font-medium">Total</th>
              <th className="py-2 font-medium">Pending</th>
            </tr>
          </thead>
          <tbody>
            {byDepartment.map((d) => (
              <tr key={d.dept} className="border-b border-slate-100 last:border-0">
                <td className="py-2">{humanize(d.dept)}</td>
                <td className="py-2">{d.total}</td>
                <td className="py-2">
                  <Badge color={d.pending > 0 ? "amber" : "green"}>{d.pending}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5">
        <SectionTitle>By assigned staff member</SectionTitle>
        {staffRows.length === 0 ? (
          <EmptyState>No work items assigned.</EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            {staffRows.map((row) => (
              <div key={row.id} className="border border-slate-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900">{row.name}</p>
                  <div className="flex gap-2">
                    <Badge color="blue">{row.total} total</Badge>
                    <Badge color={row.pending > 3 ? "red" : "amber"}>{row.pending} pending</Badge>
                    {row.blocked > 0 && <Badge color="red">{row.blocked} blocked</Badge>}
                  </div>
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  {row.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.title} · {item.student.firstName} {item.student.lastName}
                      </span>
                      <Badge color={statusColor(item.status)}>{humanize(item.status)}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>

      {unassignedItems.length > 0 && (
        <Card className="p-5 border-amber-300 bg-amber-50">
          <SectionTitle>Unassigned</SectionTitle>
          <ul className="text-sm space-y-1">
            {unassignedItems.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.title} · {item.student.firstName} {item.student.lastName} ·{" "}
                  {humanize(item.department)}
                </span>
                <Badge color={statusColor(item.priority)}>{humanize(item.priority)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { staffName, studentName } from "@/lib/displayName";
import { Tabs } from "@/components/Tabs";

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
    if (!staffMap.has(key)) staffMap.set(key, { name: staffName(item.assignedTo), items: [] });
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

  const byDepartmentTab = (
    <Card className="p-5">
      <SectionTitle>By department</SectionTitle>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
            <th className="py-2 font-medium">Department</th>
            <th className="py-2 font-medium">Total</th>
            <th className="py-2 font-medium">Pending</th>
          </tr>
        </thead>
        <tbody>
          {byDepartment.map((d) => (
            <tr key={d.dept} className="border-b border-[var(--paper-line)] last:border-0">
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
  );

  const byStaffTab = (
    <Card className="p-5">
      <SectionTitle>By assigned staff member</SectionTitle>
      {staffRows.length === 0 ? (
        <EmptyState>No work items assigned.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {staffRows.map((row) => (
            <details key={row.id} className="border border-[var(--paper-line)] rounded-md p-3.5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <p className="text-sm font-medium text-[var(--ink)]">{row.name}</p>
                <div className="flex gap-2">
                  <Badge color="blue">{row.total} total</Badge>
                  <Badge color={row.pending > 3 ? "red" : "amber"}>{row.pending} pending</Badge>
                  {row.blocked > 0 && <Badge color="red">{row.blocked} blocked</Badge>}
                </div>
              </summary>
              <ul className="text-sm text-[var(--ink-soft)] space-y-1 mt-3 pt-3 border-t border-[var(--paper-line)]">
                {row.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.title} · {studentName(item.student)}
                    </span>
                    <Badge color={statusColor(item.status)}>{humanize(item.status)}</Badge>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Workload & ownership"
        description="Who owns what right now, and where the load is concentrated. A separate lens from the aggregate pipeline counts."
      />

      {unassignedItems.length > 0 && (
        <Card className="p-4 border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-bg)]">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>Needs an owner</SectionTitle>
            <Badge color="amber">{unassignedItems.length}</Badge>
          </div>
          <ul className="text-sm space-y-1">
            {unassignedItems.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.title} · {studentName(item.student)} · {humanize(item.department)}
                </span>
                <Badge color={statusColor(item.priority)}>{humanize(item.priority)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Tabs
        tabs={[
          { label: "By department", content: byDepartmentTab },
          { label: "By staff", content: byStaffTab },
        ]}
      />
    </div>
  );
}

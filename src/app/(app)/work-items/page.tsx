import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Badge, EmptyState, Field, inputClass, Button } from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { assignWorkItemAction, updateWorkItemStatusAction, createWorkItemAction } from "./actions";

export default async function WorkItemsPage() {
  const session = await requireRole("COUNSELLOR", "APPLICATIONS_TEAM", "VISA_TEAM", "MANAGER");

  const myItems = await prisma.workItem.findMany({
    where: session.role === "MANAGER" ? {} : { assignedToId: session.id },
    include: { student: true, assignedTo: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const unassignedForMyStudents =
    session.role === "COUNSELLOR"
      ? await prisma.workItem.findMany({
          where: {
            assignedToId: null,
            student: { currentCaseManagerId: session.id },
          },
          include: { student: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

  const [allStaff, myStudents] = await Promise.all([
    prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    session.role === "COUNSELLOR" || session.role === "MANAGER"
      ? prisma.student.findMany({ orderBy: { firstName: "asc" } })
      : Promise.resolve([]),
  ]);

  const canAssign = session.role === "COUNSELLOR" || session.role === "MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Work items"
        description={
          session.role === "MANAGER"
            ? "All work items across departments."
            : "Work items assigned to you."
        }
      />

      {unassignedForMyStudents.length > 0 && (
        <Card className="p-5 border-amber-300 bg-amber-50">
          <SectionTitle>Unassigned items for my students</SectionTitle>
          <div className="flex flex-col gap-2">
            {unassignedForMyStudents.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-md px-4 py-2">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.student.firstName} {item.student.lastName} · {humanize(item.department)}
                  </p>
                </div>
                <form action={assignWorkItemAction} className="flex items-center gap-2">
                  <input type="hidden" name="workItemId" value={item.id} />
                  <select name="assignedToId" required className="text-sm rounded border border-slate-300 px-2 py-1">
                    <option value="">Assign to...</option>
                    {allStaff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <button className="text-sm text-slate-900 underline">Assign</button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle>{session.role === "MANAGER" ? "All work items" : "My work items"}</SectionTitle>
        {myItems.length === 0 ? (
          <EmptyState>No work items.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Title</th>
                <th className="py-2 font-medium">Student</th>
                <th className="py-2 font-medium">Dept</th>
                <th className="py-2 font-medium">Assigned to</th>
                <th className="py-2 font-medium">Priority</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {myItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{item.title}</td>
                  <td className="py-2">
                    <Link href={`/students/${item.studentId}`} className="underline">
                      {item.student.firstName} {item.student.lastName}
                    </Link>
                  </td>
                  <td className="py-2">{humanize(item.department)}</td>
                  <td className="py-2">
                    {canAssign ? (
                      <form action={assignWorkItemAction} className="flex items-center gap-1">
                        <input type="hidden" name="workItemId" value={item.id} />
                        <select
                          name="assignedToId"
                          defaultValue={item.assignedToId ?? ""}
                          className="text-xs rounded border border-slate-300 px-1 py-0.5"
                        >
                          <option value="">Unassigned</option>
                          {allStaff.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs underline">Save</button>
                      </form>
                    ) : (
                      item.assignedTo?.name ?? "Unassigned"
                    )}
                  </td>
                  <td className="py-2">
                    <Badge color={statusColor(item.priority)}>{humanize(item.priority)}</Badge>
                  </td>
                  <td className="py-2">
                    <Badge color={statusColor(item.status)}>{humanize(item.status)}</Badge>
                  </td>
                  <td className="py-2 text-right">
                    <form action={updateWorkItemStatusAction} className="flex items-center gap-1 justify-end">
                      <input type="hidden" name="workItemId" value={item.id} />
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="text-xs rounded border border-slate-300 px-1 py-0.5"
                      >
                        {["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "DONE"].map((s) => (
                          <option key={s} value={s}>
                            {humanize(s)}
                          </option>
                        ))}
                      </select>
                      <button className="text-xs underline">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {(session.role === "COUNSELLOR" || session.role === "MANAGER") && (
        <Card className="p-5">
          <SectionTitle>Create a work item</SectionTitle>
          <form action={createWorkItemAction} className="grid grid-cols-3 gap-3">
            <Field label="Student">
              <select name="studentId" required className={inputClass}>
                <option value="">Select student</option>
                {myStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input name="title" required className={inputClass} />
            </Field>
            <Field label="Department">
              <select name="department" required className={inputClass}>
                {["FRONT_DESK", "COUNSELLING", "APPLICATIONS", "VISA", "MANAGEMENT", "ADMIN"].map((d) => (
                  <option key={d} value={d}>
                    {humanize(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" defaultValue="MEDIUM" className={inputClass}>
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                  <option key={p} value={p}>
                    {humanize(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assign to (optional)">
              <select name="assignedToId" className={inputClass}>
                <option value="">Unassigned</option>
                {allStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date (optional)">
              <input type="date" name="dueDate" className={inputClass} />
            </Field>
            <div className="col-span-3">
              <Button type="submit" variant="secondary">
                Create work item
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

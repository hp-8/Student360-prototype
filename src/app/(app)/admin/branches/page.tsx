import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Field, inputClass, Button, EmptyState } from "@/components/ui";
import { createBranchAction } from "../actions";

export default async function AdminBranchesPage() {
  await requireRole("ADMINISTRATOR");
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { users: true, students: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Branches" />
      <Card className="p-5">
        <SectionTitle>All branches</SectionTitle>
        {branches.length === 0 ? (
          <EmptyState>No branches yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">City</th>
                <th className="py-2 font-medium">Users</th>
                <th className="py-2 font-medium">Students</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">{b.name}</td>
                  <td className="py-2">{b.city}</td>
                  <td className="py-2">{b._count.users}</td>
                  <td className="py-2">{b._count.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card className="p-5">
        <SectionTitle>Create branch</SectionTitle>
        <form action={createBranchAction} className="flex items-end gap-3">
          <Field label="Name">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="City">
            <input name="city" required className={inputClass} />
          </Field>
          <Button type="submit" variant="secondary">
            Create
          </Button>
        </form>
      </Card>
    </div>
  );
}

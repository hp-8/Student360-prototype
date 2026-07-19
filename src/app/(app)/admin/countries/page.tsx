import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Field, inputClass, Button, EmptyState, Badge } from "@/components/ui";
import { createCountryAction, createVisaRouteAction } from "../actions";

export default async function AdminCountriesPage() {
  await requireRole("ADMINISTRATOR");
  const countries = await prisma.country.findMany({
    include: { visaRoutes: { include: { requirementTemplates: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Countries & visa routes" />

      <Card className="p-5">
        <SectionTitle>Countries and their visa routes</SectionTitle>
        {countries.length === 0 ? (
          <EmptyState>No countries yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            {countries.map((c) => (
              <div key={c.id} className="border border-[var(--paper-line)] rounded-md p-4">
                <p className="text-sm font-medium text-[var(--ink)] mb-2">
                  {c.name} ({c.code})
                </p>
                {c.visaRoutes.length === 0 ? (
                  <p className="text-sm text-[var(--ink-faint)] italic">No visa routes configured.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {c.visaRoutes.map((r) => (
                      <li key={r.id} className="flex items-center justify-between">
                        <span>{r.name}</span>
                        <Badge color={r.requirementTemplates.some((t) => t.isActive) ? "green" : "amber"}>
                          {r.requirementTemplates.filter((t) => t.isActive).length > 0
                            ? `v${r.requirementTemplates.find((t) => t.isActive)?.version} active`
                            : "No active template"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Add country</SectionTitle>
        <form action={createCountryAction} className="flex items-end gap-3">
          <Field label="Name">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="ISO code">
            <input name="code" required maxLength={2} className={inputClass} placeholder="e.g. DE" />
          </Field>
          <Button type="submit" variant="secondary">
            Create
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <SectionTitle>Add visa route</SectionTitle>
        <form action={createVisaRouteAction} className="grid grid-cols-2 gap-3">
          <Field label="Country">
            <select name="countryId" required className={inputClass}>
              <option value="">Select country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Route name">
            <input name="name" required className={inputClass} placeholder="e.g. Student Visa" />
          </Field>
          <Field label="Description (optional)">
            <input name="description" className={inputClass} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="secondary">
              Create route
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

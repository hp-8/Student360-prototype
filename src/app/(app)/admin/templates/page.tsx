import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Field, inputClass, Button, EmptyState, Badge } from "@/components/ui";
import { createRequirementTemplateAction } from "../actions";

type TemplateItem = { title: string; required?: boolean };

export default async function AdminTemplatesPage() {
  await requireRole("ADMINISTRATOR");

  const routes = await prisma.visaRoute.findMany({
    include: { country: true, requirementTemplates: { orderBy: { version: "desc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Requirement templates"
        description="Versioned base checklists per country/visa route. Creating a new version does not alter checklists already generated for in-progress visa cases."
      />

      {routes.map((route) => {
        const active = route.requirementTemplates.find((t) => t.isActive);
        return (
          <Card key={route.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>
                {route.country.name} — {route.name}
              </SectionTitle>
              {active && <Badge color="green">v{active.version} active</Badge>}
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {route.requirementTemplates.map((t) => (
                <div key={t.id} className="border border-[var(--paper-line)] rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Version {t.version}</span>
                    <Badge color={t.isActive ? "green" : "slate"}>
                      {t.isActive ? "Active" : "Superseded"}
                    </Badge>
                  </div>
                  <ul className="text-sm text-[var(--ink-soft)] list-disc list-inside">
                    {(t.items as unknown as TemplateItem[]).map((item, i) => (
                      <li key={i}>{item.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {route.requirementTemplates.length === 0 && (
                <EmptyState>No template versions yet.</EmptyState>
              )}
            </div>
            <details>
              <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">
                + Publish a new version
              </summary>
              <form action={createRequirementTemplateAction} className="flex flex-col gap-3 mt-3">
                <input type="hidden" name="visaRouteId" value={route.id} />
                <Field label="Requirements (one per line)">
                  <textarea
                    name="items"
                    rows={6}
                    className={inputClass}
                    defaultValue={active ? (active.items as unknown as TemplateItem[]).map((i) => i.title).join("\n") : ""}
                  />
                </Field>
                <Button type="submit" variant="secondary" className="w-fit">
                  Publish new version
                </Button>
              </form>
            </details>
          </Card>
        );
      })}
    </div>
  );
}

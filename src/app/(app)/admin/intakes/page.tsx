import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, SectionTitle, Field, inputClass, Button, EmptyState, Badge } from "@/components/ui";
import { createIntakeAction, setIntakeDeadlineAction } from "../actions";

function formatDateInput(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AdminIntakesPage() {
  await requireRole("ADMINISTRATOR");

  const [countries, intakes] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.intake.findMany({
      include: { country: true, studyOptions: { select: { id: true } } },
      orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Intakes & deadlines"
        description="Each country can have several intakes (Fall 2026, January 2027, etc.). Setting a deadline here automatically applies it to every student currently targeting that intake."
      />

      <Card className="p-5">
        <SectionTitle>All intakes</SectionTitle>
        {intakes.length === 0 ? (
          <EmptyState>No intakes configured yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {intakes.map((intake) => (
              <div key={intake.id} className="border border-[var(--paper-line)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {intake.name} · {intake.country.name}
                    </p>
                    {intake.notes && <p className="text-xs text-[var(--ink-faint)] mt-0.5">{intake.notes}</p>}
                  </div>
                  <Badge color="blue">
                    {intake.studyOptions.length} student{intake.studyOptions.length === 1 ? "" : "s"} targeting
                  </Badge>
                </div>
                <form action={setIntakeDeadlineAction} className="flex items-end gap-3">
                  <input type="hidden" name="intakeId" value={intake.id} />
                  <Field label="Application deadline">
                    <input
                      type="date"
                      name="applicationDeadline"
                      defaultValue={formatDateInput(intake.applicationDeadline)}
                      className={inputClass}
                    />
                  </Field>
                  <Button type="submit" variant="secondary">
                    Save deadline
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Add intake</SectionTitle>
        <form action={createIntakeAction} className="grid grid-cols-2 gap-3">
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
          <Field label="Intake name">
            <input name="name" required className={inputClass} placeholder="e.g. Fall 2026" />
          </Field>
          <Field label="Application deadline (optional)">
            <input type="date" name="applicationDeadline" className={inputClass} />
          </Field>
          <Field label="Notes (optional)">
            <input name="notes" className={inputClass} />
          </Field>
          <div className="col-span-2">
            <Button type="submit" variant="secondary">
              Create intake
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

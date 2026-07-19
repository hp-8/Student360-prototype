import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { findDuplicateStudents } from "@/lib/domain/leads";
import { PageHeader, Card, SectionTitle, Field, inputClass, Button } from "@/components/ui";
import { convertAction, markLostAction } from "./actions";
import { staffName, studentName } from "@/lib/displayName";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("FRONT_DESK", "MANAGER");
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { branch: true, intendedCountry: true },
  });
  if (!lead) notFound();

  const [counsellors, duplicates] = await Promise.all([
    prisma.user.findMany({ where: { roles: { has: "COUNSELLOR" }, active: true } }),
    findDuplicateStudents({
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={`Enquiry from ${lead.branch.name} · ${lead.source ?? "Unknown source"}`}
      />

      <Card className="p-4 mb-6 text-sm">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[var(--ink-soft)]">Phone</dt>
            <dd>{lead.phone}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Email</dt>
            <dd>{lead.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Father&apos;s name</dt>
            <dd>{lead.fatherName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Mother&apos;s name</dt>
            <dd>{lead.motherName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">School</dt>
            <dd>{lead.schoolName}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">% received</dt>
            <dd>{lead.percentageReceived}%</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">University attended</dt>
            <dd>{lead.universityAttended ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Country intended</dt>
            <dd>{lead.intendedCountry?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">IELTS</dt>
            <dd>{lead.ieltsAttempted ? `Yes — ${lead.ieltsScore ?? "score not recorded"}` : "Not attempted"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[var(--ink-soft)]">Additional notes</dt>
            <dd>{lead.additionalNotes ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      {duplicates.length > 0 && (
        <Card className="p-4 mb-6 border-[var(--status-amber-fg)]/30 bg-[var(--status-amber-bg)]">
          <p className="text-sm font-medium text-[var(--status-amber-fg)] mb-2">
            Possible existing student match — confirm this is a new person before converting.
          </p>
          <ul className="text-sm text-[var(--status-amber-fg)] space-y-1">
            {duplicates.map((s) => (
              <li key={s.id}>
                {studentName(s)} · {s.phone} · case manager:{" "}
                {s.currentCaseManager ? staffName(s.currentCaseManager) : "unassigned"}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 mb-6">
        <SectionTitle>Convert to student</SectionTitle>
        <form action={convertAction} className="flex flex-col gap-4">
          <input type="hidden" name="leadId" value={lead.id} />
          <Field label="Assign case manager">
            <select name="caseManagerId" required className={inputClass}>
              <option value="">Select counsellor</option>
              {counsellors.map((c) => (
                <option key={c.id} value={c.id}>
                  {staffName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Consent notes">
            <textarea
              name="consentNotes"
              rows={2}
              className={inputClass}
              placeholder="e.g. Consented to data processing on enquiry form, signed on..."
            />
          </Field>
          <Button type="submit" className="w-fit">
            Create student profile
          </Button>
        </form>
      </Card>

      <Card className="p-4">
        <SectionTitle>Mark as lost</SectionTitle>
        <form action={markLostAction} className="flex flex-col gap-3">
          <input type="hidden" name="leadId" value={lead.id} />
          <Field label="Reason">
            <input name="reason" className={inputClass} placeholder="e.g. Chose another consultancy" />
          </Field>
          <Button type="submit" variant="secondary" className="w-fit">
            Mark enquiry as lost
          </Button>
        </form>
      </Card>
    </div>
  );
}

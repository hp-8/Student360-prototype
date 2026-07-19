import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  PageHeader,
  SectionTitle,
  Badge,
  EmptyState,
  Field,
  inputClass,
  Button,
} from "@/components/ui";
import { statusColor, humanize } from "@/lib/statusColors";
import { staffName, studentName } from "@/lib/displayName";
import {
  updateAttemptAction,
  reopenAttemptAction,
  closeVisaCaseAction,
  changeActiveOfferAction,
  updateChecklistItemAction,
  addChecklistItemAction,
} from "./actions";

const ATTEMPT_STATUSES = [
  "DOCUMENTS_PENDING",
  "READY_TO_FILE",
  "SUBMITTED",
  "BIOMETRICS_PENDING",
  "INTERVIEW_PENDING",
  "ADDITIONAL_DOCUMENTS",
  "DECISION_PENDING",
  "APPROVED",
  "REFUSED",
  "WITHDRAWN",
];
const EVENT_TYPES = [
  "FILING",
  "APPOINTMENT",
  "BIOMETRICS",
  "INTERVIEW",
  "ADDITIONAL_DOCUMENTS_REQUESTED",
  "APPROVAL",
  "REFUSAL",
  "WITHDRAWAL",
  "NOTE",
];
const CHECKLIST_STATUSES = ["PENDING", "RECEIVED", "VERIFIED", "WAIVED"];

export async function VisaCaseDetailContent({ id }: { id: string }) {
  const session = await requireRole("COUNSELLOR", "VISA_TEAM", "MANAGER");

  const visaCase = await prisma.visaCase.findUnique({
    where: { id },
    include: {
      student: true,
      country: true,
      visaRoute: true,
      requirementTemplate: true,
      activeOffer: true,
      assignedTo: true,
      openedBy: true,
      attempts: { include: { events: { orderBy: { eventDate: "asc" } } }, orderBy: { attemptNumber: "desc" } },
      checklistItems: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!visaCase) notFound();

  const canEdit = session.role === "VISA_TEAM" || session.role === "MANAGER";

  const [otherOffers, onHoldOptions] = await Promise.all([
    prisma.offer.findMany({
      where: { studentId: visaCase.studentId, countryId: visaCase.countryId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.studyOption.findMany({
      where: { studentId: visaCase.studentId, status: "ON_HOLD" },
      include: { country: true },
    }),
  ]);

  const latestAttempt = visaCase.attempts[0];
  const canReopen = canEdit && visaCase.lifecycleStatus === "OPEN" && latestAttempt?.status === "REFUSED";
  const canClose = canEdit && visaCase.lifecycleStatus === "OPEN";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${visaCase.country.name} visa case`}
        description={
          <>
            {visaCase.visaRoute.name} · student:{" "}
            <Link href={`/students/${visaCase.studentId}`} className="underline">
              {studentName(visaCase.student)}
            </Link>{" "}
            · assigned to {visaCase.assignedTo ? staffName(visaCase.assignedTo) : "unassigned"}
          </>
        }
        action={
          <div className="flex items-center gap-2">
            <Badge color={statusColor(visaCase.lifecycleStatus)}>
              {humanize(visaCase.lifecycleStatus)}
            </Badge>
            {visaCase.closeReason && (
              <Badge color="slate">{humanize(visaCase.closeReason)}</Badge>
            )}
          </div>
        }
      />

      <Card className="p-5">
        <SectionTitle>Active offer</SectionTitle>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          {visaCase.activeOffer
            ? `${visaCase.activeOffer.universityName} · ${visaCase.activeOffer.courseName} (${humanize(
                visaCase.activeOffer.status
              )})`
            : "No active offer linked."}
        </p>
        {canEdit && otherOffers.length > 1 && (
          <form action={changeActiveOfferAction} className="flex items-end gap-3">
            <input type="hidden" name="visaCaseId" value={visaCase.id} />
            <Field label="Switch active offer">
              <select name="newOfferId" defaultValue={visaCase.activeOfferId ?? ""} className={inputClass}>
                {otherOffers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.universityName} ({humanize(o.status)})
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" variant="secondary">
              Switch
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Checklist (v{visaCase.requirementTemplate.version} base + offer-specific)</SectionTitle>
        {visaCase.checklistItems.length === 0 ? (
          <EmptyState>No checklist items.</EmptyState>
        ) : (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visaCase.checklistItems.map((item) => (
                <tr key={item.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="py-2">{item.title}</td>
                  <td className="py-2">
                    <Badge color={item.source === "BASE" ? "slate" : "purple"}>
                      {humanize(item.source)}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge color={statusColor(item.status)}>{humanize(item.status)}</Badge>
                  </td>
                  <td className="py-2 text-right">
                    {canEdit && (
                      <form action={updateChecklistItemAction} className="inline-flex gap-2 items-center">
                        <input type="hidden" name="visaCaseId" value={visaCase.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <select
                          name="status"
                          defaultValue={item.status}
                          className="text-xs rounded border border-[var(--paper-line)] px-1 py-0.5"
                        >
                          {CHECKLIST_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {humanize(s)}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs text-[var(--ink)] underline">Save</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {canEdit && (
          <details>
            <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">
              + Add offer-specific requirement
            </summary>
            <form action={addChecklistItemAction} className="flex items-end gap-3 mt-3">
              <input type="hidden" name="visaCaseId" value={visaCase.id} />
              <Field label="Requirement">
                <input name="title" required className={inputClass} />
              </Field>
              <Button type="submit" variant="secondary">
                Add
              </Button>
            </form>
          </details>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Attempts</SectionTitle>
        <div className="flex flex-col gap-4">
          {visaCase.attempts.map((attempt) => (
            <div key={attempt.id} className="border border-[var(--paper-line)] rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-sm font-semibold text-[var(--ink)]">
                  Attempt {attempt.attemptNumber}
                </p>
                <Badge color={statusColor(attempt.status)}>{humanize(attempt.status)}</Badge>
              </div>
              <ul className="text-sm text-[var(--ink-soft)] space-y-1 mb-3">
                {attempt.events.map((e) => (
                  <li key={e.id}>
                    {e.eventDate.toLocaleDateString()} · {humanize(e.type)}
                    {e.notes ? ` — ${e.notes}` : ""}
                  </li>
                ))}
              </ul>
              {canEdit &&
                attempt.attemptNumber === latestAttempt.attemptNumber &&
                !["APPROVED", "REFUSED", "WITHDRAWN"].includes(attempt.status) && (
                  <form action={updateAttemptAction} className="grid grid-cols-3 gap-3">
                    <input type="hidden" name="visaCaseId" value={visaCase.id} />
                    <input type="hidden" name="attemptId" value={attempt.id} />
                    <Field label="Event type">
                      <select name="eventType" className={inputClass} defaultValue="NOTE">
                        {EVENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {humanize(t)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="New status">
                      <select name="newStatus" className={inputClass} defaultValue={attempt.status}>
                        {ATTEMPT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {humanize(s)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Notes">
                      <input name="notes" className={inputClass} />
                    </Field>
                    <div className="col-span-3">
                      <Button type="submit" variant="secondary">
                        Log milestone
                      </Button>
                    </div>
                  </form>
                )}
            </div>
          ))}
        </div>
      </Card>

      {canEdit && visaCase.lifecycleStatus === "OPEN" && (
        <Card className="p-5">
          <SectionTitle>Case actions</SectionTitle>
          <div className="flex flex-col gap-4">
            {canReopen && (
              <form action={reopenAttemptAction} className="flex items-end gap-3">
                <input type="hidden" name="visaCaseId" value={visaCase.id} />
                <Field label="Reopen as a new attempt (after refusal)">
                  <input name="notes" className={inputClass} placeholder="Reason for reapplying" />
                </Field>
                <Button type="submit">Reopen new attempt</Button>
              </form>
            )}
            {canClose && (
              <form action={closeVisaCaseAction} className="grid grid-cols-3 gap-3 items-end">
                <input type="hidden" name="visaCaseId" value={visaCase.id} />
                <Field label="Close reason">
                  <select name="reason" className={inputClass} defaultValue="PLAN_ENDED">
                    <option value="PIVOTED">Pivot to a different study option</option>
                    <option value="PLAN_ENDED">Student ending the plan</option>
                  </select>
                </Field>
                <Field label="Pivot to (if applicable)">
                  <select name="pivotToStudyOptionId" className={inputClass} defaultValue="">
                    <option value="">—</option>
                    {onHoldOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.universityName} ({o.country.name})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Notes">
                  <input name="notes" className={inputClass} />
                </Field>
                <div className="col-span-3">
                  <Button type="submit" variant="danger">
                    Close visa case
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

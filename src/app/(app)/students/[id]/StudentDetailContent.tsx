import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  SectionTitle,
  Badge,
  EmptyState,
  Field,
  inputClass,
  Button,
} from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { JourneyGraph } from "@/components/JourneyGraph";
import { BackLink } from "@/components/BackLink";
import { IntakePicker } from "@/components/IntakePicker";
import { statusColor, humanize } from "@/lib/statusColors";
import { getDirectReports } from "@/lib/domain/hierarchy";
import { hasCaseAccess } from "@/lib/domain/audit";
import { buildStudentTimeline } from "@/lib/domain/timeline";
import { computeStudentStage, stageColor, nextStepFor } from "@/lib/domain/stage";
import { staffName, studentName } from "@/lib/displayName";
import {
  createStudyOptionAction,
  confirmCountryAction,
  reassignCaseManagerAction,
  addNoteAction,
  addDocumentAction,
  verifyDocumentAction,
  upsertEnrollmentAction,
  recordTestAttemptAction,
} from "./actions";

const LEARNING_SERVICES = ["IELTS", "GERMAN_CLASS", "FRENCH_CLASS", "SOP_ASSISTANCE", "INTERVIEW_PREP"];
const ENROLLMENT_STATUSES = ["NOT_ENROLLED", "ENROLLED", "COMPLETED"];
const TEST_TYPES = ["IELTS", "TOEFL", "PTE", "TCF", "GOETHE", "OTHER"];

export async function StudentDetailContent({ id }: { id: string }) {
  const session = await requireRole(
    "COUNSELLOR",
    "APPLICATIONS_TEAM",
    "VISA_TEAM",
    "MANAGER"
  );

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      branch: true,
      intendedCountry: true,
      currentCaseManager: true,
      caseAssignments: {
        include: { staff: true, assignedBy: true },
        orderBy: { startedAt: "desc" },
      },
      studyOptions: {
        include: {
          country: true,
          assignedCounsellor: true,
          assignedAppsUser: true,
          applications: { include: { offer: true } },
          sopRecords: true,
          intakeCatalog: { select: { name: true, applicationDeadline: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      countryConfirmations: { include: { country: true }, orderBy: { confirmedAt: "desc" } },
      offers: { include: { country: true }, orderBy: { createdAt: "desc" } },
      visaCases: {
        include: {
          country: true,
          visaRoute: true,
          activeOffer: { include: { application: true } },
          assignedTo: true,
          attempts: {
            include: { events: { orderBy: { eventDate: "asc" } } },
            orderBy: { attemptNumber: "desc" },
          },
        },
        orderBy: { openedAt: "desc" },
      },
      documents: {
        include: {
          uploadedBy: true,
          verifiedBy: true,
          links: { include: { studyOption: true, visaCase: { include: { country: true } } } },
        },
        orderBy: { uploadedAt: "desc" },
      },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      learningEnrollments: true,
      testAttempts: { orderBy: { testDate: "desc" } },
      originatingLead: { select: { id: true } },
    },
  });
  if (!student) notFound();

  const canEditStudyOptions = session.role === "COUNSELLOR" || session.role === "MANAGER";
  const canManageCaseManager = session.role === "MANAGER";
  const showVisaSection = session.role !== "APPLICATIONS_TEAM";

  const [countries, counsellors, intakes] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    canManageCaseManager
      ? getDirectReports(session.id, "COUNSELLOR")
      : prisma.user.findMany({ where: { roles: { has: "COUNSELLOR" }, active: true } }),
    prisma.intake.findMany({ select: { id: true, name: true, countryId: true } }),
  ]);

  const confirmedCountryIds = new Set(
    student.countryConfirmations.filter((c) => !c.releasedAt).map((c) => c.countryId)
  );

  const targetIntakes = Array.from(
    new Map(
      student.studyOptions.map((so) => [
        `${so.countryId}::${so.intake}`,
        `${so.intake} (${so.country.name})`,
      ])
    ).values()
  );

  const canSeeSystemActivity = await hasCaseAccess(session, student.id);
  const auditLogs = canSeeSystemActivity
    ? await prisma.auditLog.findMany({
        where: student.originatingLead
          ? { OR: [{ studentId: student.id }, { leadId: student.originatingLead.id }] }
          : { studentId: student.id },
        include: { actor: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  type FeedEntry = { id: string; kind: "note" | "action"; body: string; actorName: string; createdAt: Date };
  const activityFeed: FeedEntry[] = [
    ...student.notes.map((n): FeedEntry => ({
      id: `note-${n.id}`,
      kind: "note",
      body: n.body,
      actorName: staffName(n.author),
      createdAt: n.createdAt,
    })),
    ...auditLogs.map((a): FeedEntry => ({
      id: `audit-${a.id}`,
      kind: "action",
      body: a.action,
      actorName: staffName(a.actor),
      createdAt: a.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const stage = computeStudentStage(student);
  const nextStep = nextStepFor(stage);

  const timelineEntries = buildStudentTimeline(student);
  const timelineTab = (
    <Card className="p-5">
      <SectionTitle>Journey</SectionTitle>
      <JourneyGraph entries={timelineEntries} />
    </Card>
  );

  const overviewTab = (
    <>
      {canManageCaseManager && (
        <Card className="p-5">
          <SectionTitle>{student.currentCaseManager ? "Case manager" : "Assign case manager"}</SectionTitle>
          <form action={reassignCaseManagerAction} className="flex items-end gap-3">
            <input type="hidden" name="studentId" value={student.id} />
            <Field label={student.currentCaseManager ? "Reassign to" : "Assign to"}>
              <select name="newStaffId" required className={inputClass}>
                <option value="">Select counsellor</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {staffName(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reason">
              <input name="note" className={inputClass} placeholder="e.g. Workload rebalancing" />
            </Field>
            <Button type="submit">{student.currentCaseManager ? "Reassign" : "Assign"}</Button>
          </form>
          <div className="mt-4">
            <p className="text-xs font-medium text-[var(--ink-soft)] mb-2">History</p>
            <ul className="text-sm space-y-1">
              {student.caseAssignments.map((ca) => (
                <li key={ca.id} className="text-[var(--ink-soft)]">
                  {staffName(ca.staff)} from {ca.startedAt.toLocaleDateString()}
                  {ca.endedAt ? ` to ${ca.endedAt.toLocaleDateString()}` : " (active)"} ·
                  assigned by {staffName(ca.assignedBy)}
                  {ca.note ? ` — ${ca.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle>Confirmed routes</SectionTitle>
        {student.countryConfirmations.filter((c) => !c.releasedAt).length === 0 ? (
          <EmptyState>
            No country confirmed yet — use &ldquo;Move forward with this country&rdquo; on a study option once
            one is decided.
          </EmptyState>
        ) : (
          <div className="flex flex-wrap gap-2">
            {student.countryConfirmations
              .filter((c) => !c.releasedAt)
              .map((c) => (
                <Badge key={c.id} color="green">
                  {c.country.name} · confirmed {c.confirmedAt.toLocaleDateString()}
                </Badge>
              ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Learning services &amp; test attempts</SectionTitle>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-[var(--ink-soft)] mb-2">Enrollments</p>
            {student.learningEnrollments.length === 0 ? (
              <EmptyState>None on file.</EmptyState>
            ) : (
              <ul className="text-sm space-y-1 mb-3">
                {student.learningEnrollments.map((e) => (
                  <li key={e.id} className="flex justify-between">
                    <span>{humanize(e.service)}</span>
                    <Badge color={statusColor(e.status)}>{humanize(e.status)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {canEditStudyOptions && (
              <details>
                <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">+ Enroll / update</summary>
                <form action={upsertEnrollmentAction} className="flex flex-col gap-3 mt-3">
                  <input type="hidden" name="studentId" value={student.id} />
                  <Field label="Service">
                    <select name="service" required className={inputClass}>
                      {LEARNING_SERVICES.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select name="status" required defaultValue="ENROLLED" className={inputClass}>
                      {ENROLLMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Notes (optional)">
                    <input name="notes" className={inputClass} />
                  </Field>
                  <Button type="submit" variant="secondary" className="w-fit">
                    Save
                  </Button>
                </form>
              </details>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--ink-soft)] mb-2">Test attempts</p>
            {student.testAttempts.length === 0 ? (
              <EmptyState>None on file.</EmptyState>
            ) : (
              <ul className="text-sm space-y-1 mb-3">
                {student.testAttempts.map((t) => (
                  <li key={t.id}>
                    {humanize(t.testType)}: {t.score} ({t.testDate.toLocaleDateString()})
                  </li>
                ))}
              </ul>
            )}
            {canEditStudyOptions && (
              <details>
                <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">+ Log test attempt</summary>
                <form action={recordTestAttemptAction} className="flex flex-col gap-3 mt-3">
                  <input type="hidden" name="studentId" value={student.id} />
                  <Field label="Test">
                    <select name="testType" required className={inputClass}>
                      {TEST_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {humanize(t)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Score">
                    <input name="score" required className={inputClass} placeholder="e.g. Overall 7.5" />
                  </Field>
                  <Field label="Test date">
                    <input type="date" name="testDate" required className={inputClass} />
                  </Field>
                  <Field label="Notes (optional)">
                    <input name="notes" className={inputClass} />
                  </Field>
                  <Button type="submit" variant="secondary" className="w-fit">
                    Save
                  </Button>
                </form>
              </details>
            )}
          </div>
        </div>
      </Card>
    </>
  );

  const studyOptionsTab = (
    <Card className="p-5">
      <details>
        <summary className="text-sm font-semibold text-[var(--ink)] cursor-pointer">
          Study options ({student.studyOptions.length})
        </summary>
        <div className="mt-3.5">
          {student.studyOptions.length === 0 ? (
            <EmptyState>No study options yet.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {student.studyOptions.map((so) => {
                const latestSop = [...so.sopRecords].sort(
                  (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                )[0];
                const isConfirmed = confirmedCountryIds.has(so.countryId);
                return (
                  <div
                    key={so.id}
                    className="flex items-center justify-between border border-[var(--paper-line)] rounded-md px-3 py-2 hover:bg-[var(--paper)]"
                  >
                    <Link href={`/study-options/${so.id}`} className="text-sm font-medium text-[var(--ink)] hover:underline">
                      {so.universityName}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ink-soft)]">
                        {so.country.name} · {so.intake}
                      </span>
                      {latestSop && (
                        <Badge color={statusColor(latestSop.status)}>SOP: {humanize(latestSop.status)}</Badge>
                      )}
                      {isConfirmed ? (
                        <Badge color="green">Route confirmed</Badge>
                      ) : (
                        canEditStudyOptions && (
                          <form action={confirmCountryAction}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="hidden" name="countryId" value={so.countryId} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-[var(--navy)] hover:underline whitespace-nowrap"
                            >
                              Move forward with {so.country.name}
                            </button>
                          </form>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {canEditStudyOptions && (
            <details className="mt-2">
              <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">
                + Add a new study option
              </summary>
              <form action={createStudyOptionAction} className="grid grid-cols-2 gap-3 mt-3">
                <input type="hidden" name="studentId" value={student.id} />
                <IntakePicker countries={countries} intakes={intakes} />
                <Field label="University">
                  <input name="universityName" required className={inputClass} />
                </Field>
                <Field label="Course">
                  <input name="courseName" required className={inputClass} />
                </Field>
                <div className="col-span-2">
                  <Button type="submit" variant="secondary">
                    Add study option
                  </Button>
                </div>
              </form>
            </details>
          )}
        </div>
      </details>
    </Card>
  );

  const visaTab = (
    <Card className="p-5">
      <SectionTitle
        action={
          (session.role === "VISA_TEAM" || session.role === "MANAGER") && (
            <Link
              href={`/visa/new?studentId=${student.id}`}
              className="text-sm text-[var(--ink)] underline"
            >
              Start visa application
            </Link>
          )
        }
      >
        Visa cases
      </SectionTitle>
      {student.visaCases.length === 0 ? (
        <EmptyState>No visa application started yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2">
          {student.visaCases.map((vc) => {
            const latestAttempt = vc.attempts[0];
            return (
              <Link
                key={vc.id}
                href={`/visa/${vc.id}`}
                className="flex items-center justify-between border border-[var(--paper-line)] rounded-md px-4 py-3 hover:bg-[var(--paper)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {vc.country.name} · {vc.visaRoute.name}
                  </p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {vc.activeOffer
                      ? `Active offer: ${vc.activeOffer.universityName}`
                      : "No active offer set"}{" "}
                    · assigned to {vc.assignedTo ? staffName(vc.assignedTo) : "unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {latestAttempt && (
                    <Badge color={statusColor(latestAttempt.status)}>
                      Attempt {latestAttempt.attemptNumber}: {humanize(latestAttempt.status)}
                    </Badge>
                  )}
                  <Badge color={statusColor(vc.lifecycleStatus)}>
                    {humanize(vc.lifecycleStatus)}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );

  const documentsTab = (
    <Card className="p-5">
      <SectionTitle>Documents</SectionTitle>
      {student.documents.length === 0 ? (
        <EmptyState>No documents uploaded.</EmptyState>
      ) : (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-[var(--paper-line)] text-left text-[var(--ink-soft)]">
              <th className="py-2 font-medium">Label</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Linked to</th>
              <th className="py-2 font-medium">Expiry</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {student.documents.map((d) => {
              const link = d.links[0];
              const linkLabel = link?.studyOption
                ? `${link.studyOption.universityName} (study option)`
                : link?.visaCase
                  ? `${link.visaCase.country.name} visa case`
                  : null;
              return (
                <tr key={d.id} className="border-b border-[var(--paper-line)] last:border-0">
                  <td className="py-2">
                    {d.fileUrl ? (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--navy)] hover:underline"
                      >
                        {d.label}
                      </a>
                    ) : (
                      d.label
                    )}
                  </td>
                  <td className="py-2">{humanize(d.type)}</td>
                  <td className="py-2 text-[var(--ink-soft)]">{linkLabel ?? "—"}</td>
                  <td className="py-2">
                    {d.expiryDate ? d.expiryDate.toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2">
                    {d.verified ? (
                      <Badge color="green">Verified</Badge>
                    ) : (
                      <Badge color="amber">Unverified</Badge>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {!d.verified && (
                      <form action={verifyDocumentAction}>
                        <input type="hidden" name="studentId" value={student.id} />
                        <input type="hidden" name="documentId" value={d.id} />
                        <button className="text-[var(--ink)] underline text-sm">
                          Mark verified
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <details>
        <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">+ Add a document</summary>
        <form action={addDocumentAction} className="grid grid-cols-2 gap-3 mt-3">
          <input type="hidden" name="studentId" value={student.id} />
          <Field label="Label">
            <input name="label" required className={inputClass} />
          </Field>
          <Field label="Type">
            <select name="type" required className={inputClass}>
              {[
                "PASSPORT",
                "IELTS_SCORE",
                "BANK_STATEMENT",
                "SOP",
                "OFFER_LETTER",
                "VISA_FORM",
                "ACADEMIC_TRANSCRIPT",
                "RECOMMENDATION_LETTER",
                "FINANCIAL_AFFIDAVIT",
                "VISA_APPOINTMENT_CONFIRMATION",
                "OTHER",
              ].map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Google Drive link (optional)">
            <input
              type="url"
              name="fileUrl"
              placeholder="https://drive.google.com/..."
              className={inputClass}
            />
          </Field>
          <Field label="Link to (optional)">
            <select name="linkTo" defaultValue="" className={inputClass}>
              <option value="">Not linked to a specific case</option>
              {student.studyOptions.map((so) => (
                <option key={so.id} value={`studyOption:${so.id}`}>
                  {so.universityName} ({so.country.name}) — study option
                </option>
              ))}
              {student.visaCases.map((vc) => (
                <option key={vc.id} value={`visaCase:${vc.id}`}>
                  {vc.country.name} — visa case
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expiry date (optional)">
            <input type="date" name="expiryDate" className={inputClass} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="secondary">
              Add document
            </Button>
          </div>
        </form>
      </details>
    </Card>
  );

  const activityTab = (
    <Card className="p-5">
      <SectionTitle>Activity</SectionTitle>
      <form action={addNoteAction} className="flex gap-3 mb-4">
        <input type="hidden" name="studentId" value={student.id} />
        <input
          name="body"
          placeholder="Add a note..."
          required
          className={`${inputClass} flex-1`}
        />
        <Button type="submit" variant="secondary">
          Add
        </Button>
      </form>
      {!canSeeSystemActivity && (
        <p className="text-xs text-[var(--ink-soft)]/70 italic mb-3">
          Showing notes only. System activity is visible to staff currently working this case,
          plus Managers and Administrators.
        </p>
      )}
      {activityFeed.length === 0 ? (
        <EmptyState>No activity yet.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {activityFeed.map((entry) => (
            <li
              key={entry.id}
              className={`text-sm pl-3 ${
                entry.kind === "note"
                  ? "border-l-2 border-[var(--brass-soft)]"
                  : "border-l-2 border-[var(--paper-line)]"
              }`}
            >
              <p className={entry.kind === "note" ? "text-[var(--ink)]" : "text-[var(--ink-soft)] italic"}>
                {entry.body}
              </p>
              <p className="text-xs text-[var(--ink-soft)]/70 mt-0.5">
                {entry.actorName} · {entry.createdAt.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const tabs = [
    { label: "Journey", content: timelineTab },
    { label: "Overview", content: overviewTab },
    { label: "Study Options", content: studyOptionsTab },
    ...(showVisaSection ? [{ label: "Visa Applications", content: visaTab }] : []),
    { label: "Documents", content: documentsTab },
    { label: "Activity", content: activityTab },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--ink)]">{studentName(student)}</h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              {student.branch.name} · Enquiry {student.enquiryDate.toLocaleDateString()}
            </p>
          </div>
          <Badge color="blue">
            Case manager:{" "}
            {student.currentCaseManager ? staffName(student.currentCaseManager) : "Unassigned"}
          </Badge>
        </div>
        <dl className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <dt className="text-[var(--ink-soft)]">Case manager</dt>
            <dd>{student.currentCaseManager ? staffName(student.currentCaseManager) : "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Phone</dt>
            <dd>{student.phone}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Email</dt>
            <dd>{student.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Guardian</dt>
            <dd>
              {student.guardianName
                ? `${student.guardianName} (${student.guardianRelation ?? "—"}) · ${student.guardianPhone ?? "—"}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Parents</dt>
            <dd>{[student.fatherName, student.motherName].filter(Boolean).join(" · ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">School / % received</dt>
            <dd>
              {student.schoolName ?? "—"}
              {student.percentageReceived != null ? ` · ${student.percentageReceived}%` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">University attended</dt>
            <dd>{student.universityAttended ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Country intended</dt>
            <dd>{student.intendedCountry?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">Target intake(s)</dt>
            <dd>
              {targetIntakes.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {targetIntakes.map((t) => (
                    <Badge key={t} color="blue">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--ink-soft)]">IELTS</dt>
            <dd>
              {student.ieltsAttempted
                ? `Yes — ${student.ieltsScore ?? "score not recorded"}`
                : "Not attempted"}
            </dd>
          </div>
          <div className="col-span-3">
            <dt className="text-[var(--ink-soft)]">Additional notes</dt>
            <dd>{student.additionalNotes ?? "—"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--ink-soft)] uppercase tracking-wide">Next step</p>
          <p className="text-sm mt-1">{nextStep.message}</p>
        </div>
        <Badge color={stageColor(stage)}>{stage}</Badge>
      </Card>

      <Tabs tabs={tabs} />
    </div>
  );
}

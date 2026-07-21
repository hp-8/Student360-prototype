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
import { BackLink } from "@/components/BackLink";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
  createApplicationAction,
  updateApplicationStatusAction,
  recordOfferAction,
  updateOfferStatusAction,
  createSopRecordAction,
  updateSopStatusAction,
  updateStudyOptionStatusAction,
  updateStudyOptionAction,
  deleteStudyOptionAction,
  reassignStudyOptionAppsUserAction,
} from "./actions";

const APPLICATION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "DECIDED", "WITHDRAWN"];
const OFFER_STATUSES = ["CONDITIONAL", "UNCONDITIONAL", "ACCEPTED", "REJECTED", "WITHDRAWN", "DEFERRED"];
const SOP_STATUSES = ["NOT_STARTED", "DRAFTING", "REVIEW", "FINAL"];
const STUDY_OPTION_STATUSES = ["ACTIVE", "ON_HOLD", "WITHDRAWN", "UNSUCCESSFUL", "REJECTED"];

export async function StudyOptionDetailContent({ id }: { id: string }) {
  const session = await requireRole("COUNSELLOR", "APPLICATIONS_TEAM", "MANAGER");

  const studyOption = await prisma.studyOption.findUnique({
    where: { id },
    include: {
      student: true,
      country: true,
      assignedCounsellor: true,
      assignedAppsUser: true,
      applications: { include: { offer: true }, orderBy: { createdAt: "desc" } },
      sopRecords: { orderBy: { createdAt: "desc" } },
      workItems: { select: { id: true } },
    },
  });
  if (!studyOption) notFound();

  const canEditApplications = session.role === "APPLICATIONS_TEAM" || session.role === "MANAGER";
  const canEditStatus = session.role === "COUNSELLOR" || session.role === "MANAGER";

  const [countries, appsUsers] = await Promise.all([
    canEditStatus ? prisma.country.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    prisma.user.findMany({ where: { roles: { has: "APPLICATIONS_TEAM" }, active: true }, orderBy: { name: "asc" } }),
  ]);
  const canDelete =
    canEditStatus &&
    studyOption.applications.length === 0 &&
    studyOption.sopRecords.length === 0 &&
    studyOption.workItems.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <BackLink fallbackHref={`/students/${studyOption.studentId}`} />
      <PageHeader
        title={`${studyOption.universityName} · ${studyOption.courseName}`}
        description={
          <>
            {studyOption.country.name} · {studyOption.intake} · student:{" "}
            <Link href={`/students/${studyOption.studentId}`} className="underline">
              {studentName(studyOption.student)}
            </Link>
          </>
        }
        action={
          canEditStatus && (
            <div className="flex items-center gap-3">
              <details className="text-right">
                <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">Edit details</summary>
                <form
                  action={updateStudyOptionAction}
                  className="grid grid-cols-2 gap-3 mt-3 text-left w-[420px]"
                >
                  <input type="hidden" name="studyOptionId" value={studyOption.id} />
                  <input type="hidden" name="intakeId" value={studyOption.intakeId ?? ""} />
                  <Field label="Country">
                    <select name="countryId" defaultValue={studyOption.countryId} required className={inputClass}>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Intake">
                    <input name="intake" defaultValue={studyOption.intake} required className={inputClass} />
                  </Field>
                  <Field label="University">
                    <input name="universityName" defaultValue={studyOption.universityName} required className={inputClass} />
                  </Field>
                  <Field label="Course">
                    <input name="courseName" defaultValue={studyOption.courseName} required className={inputClass} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Notes (optional)">
                      <input name="notes" defaultValue={studyOption.notes ?? ""} className={inputClass} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" variant="secondary">
                      Save changes
                    </Button>
                  </div>
                </form>
              </details>
              {canDelete && (
                <form action={deleteStudyOptionAction}>
                  <input type="hidden" name="studyOptionId" value={studyOption.id} />
                  <input type="hidden" name="studentId" value={studyOption.studentId} />
                  <ConfirmButton
                    type="submit"
                    confirmText={`Delete the ${studyOption.universityName} study option? This can't be undone.`}
                    className="text-sm text-[var(--status-red-fg)] hover:underline"
                  >
                    Delete
                  </ConfirmButton>
                </form>
              )}
            </div>
          )
        }
      />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Status</SectionTitle>
          <Badge color={statusColor(studyOption.status)}>{humanize(studyOption.status)}</Badge>
        </div>
        <p className="text-sm text-[var(--ink-soft)] mb-3">
          Counsellor: {studyOption.assignedCounsellor ? staffName(studyOption.assignedCounsellor) : "—"} ·
          Applications team:{" "}
          {studyOption.assignedAppsUser ? staffName(studyOption.assignedAppsUser) : "—"}
        </p>
        {canEditStatus && (
          <form action={reassignStudyOptionAppsUserAction} className="flex items-end gap-3 mb-4">
            <input type="hidden" name="studyOptionId" value={studyOption.id} />
            <Field label={studyOption.assignedAppsUser ? "Reassign applications team" : "Assign applications team"}>
              <select name="newAppsUserId" required defaultValue={studyOption.assignedAppsUserId ?? ""} className={inputClass}>
                <option value="">Select member</option>
                {appsUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" variant="secondary">
              {studyOption.assignedAppsUser ? "Reassign" : "Assign"}
            </Button>
          </form>
        )}
        {canEditStatus && (
          <form action={updateStudyOptionStatusAction} className="flex items-end gap-3">
            <input type="hidden" name="studyOptionId" value={studyOption.id} />
            <input type="hidden" name="studentId" value={studyOption.studentId} />
            <Field label="Change status">
              <select name="status" defaultValue={studyOption.status} className={inputClass}>
                {STUDY_OPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="submit" variant="secondary">
              Update
            </Button>
          </form>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>Applications &amp; offers</SectionTitle>
        {studyOption.applications.length === 0 ? (
          <EmptyState>No applications yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-4 mb-4">
            {studyOption.applications.map((app) => (
              <div key={app.id} className="border border-[var(--paper-line)] rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    Application · applied {app.appliedDate.toLocaleDateString()}
                  </p>
                  <Badge color={statusColor(app.status)}>{humanize(app.status)}</Badge>
                </div>
                {canEditApplications && (
                  <form action={updateApplicationStatusAction} className="flex items-end gap-3 mb-3">
                    <input type="hidden" name="studyOptionId" value={studyOption.id} />
                    <input type="hidden" name="studentId" value={studyOption.studentId} />
                    <input type="hidden" name="applicationId" value={app.id} />
                    <Field label="Application status">
                      <select name="status" defaultValue={app.status} className={inputClass}>
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {humanize(s)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Button type="submit" variant="secondary">
                      Update
                    </Button>
                  </form>
                )}
                {app.offer ? (
                  <div className="bg-[var(--paper)] rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span>
                        Offer received {app.offer.receivedDate.toLocaleDateString()}
                        {app.offer.conditions ? ` · ${app.offer.conditions}` : ""}
                      </span>
                      <Badge color={statusColor(app.offer.status)}>
                        {humanize(app.offer.status)}
                      </Badge>
                    </div>
                    {(session.role === "APPLICATIONS_TEAM" || session.role === "MANAGER" || session.role === "COUNSELLOR") && (
                      <div className="flex items-end gap-3 flex-wrap">
                        {app.offer.status === "UNCONDITIONAL" && (
                          <form action={updateOfferStatusAction}>
                            <input type="hidden" name="studyOptionId" value={studyOption.id} />
                            <input type="hidden" name="studentId" value={studyOption.studentId} />
                            <input type="hidden" name="offerId" value={app.offer.id} />
                            <input type="hidden" name="status" value="ACCEPTED" />
                            <Button type="submit">Accept this offer</Button>
                          </form>
                        )}
                        <form action={updateOfferStatusAction} className="flex items-end gap-3">
                          <input type="hidden" name="studyOptionId" value={studyOption.id} />
                          <input type="hidden" name="studentId" value={studyOption.studentId} />
                          <input type="hidden" name="offerId" value={app.offer.id} />
                          <Field label="Offer status">
                            <select name="status" defaultValue={app.offer.status} className={inputClass}>
                              {OFFER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {humanize(s)}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Button type="submit" variant="secondary">
                            Update offer
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  canEditApplications && (
                    <details>
                      <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">
                        + Record offer for this application
                      </summary>
                      <form action={recordOfferAction} className="grid grid-cols-2 gap-3 mt-3">
                        <input type="hidden" name="studyOptionId" value={studyOption.id} />
                        <input type="hidden" name="studentId" value={studyOption.studentId} />
                        <input type="hidden" name="countryId" value={studyOption.countryId} />
                        <input type="hidden" name="applicationId" value={app.id} />
                        <input type="hidden" name="universityName" value={studyOption.universityName} />
                        <input type="hidden" name="courseName" value={studyOption.courseName} />
                        <input type="hidden" name="intake" value={studyOption.intake} />
                        <Field label="Offer status">
                          <select name="status" required className={inputClass}>
                            {OFFER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {humanize(s)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Conditions (optional)">
                          <input name="conditions" className={inputClass} />
                        </Field>
                        <div className="col-span-2">
                          <Button type="submit" variant="secondary">
                            Save offer
                          </Button>
                        </div>
                      </form>
                    </details>
                  )
                )}
              </div>
            ))}
          </div>
        )}
        {canEditApplications && (
          <details>
            <summary className="text-sm text-[var(--ink-soft)] cursor-pointer">
              + Log a new application
            </summary>
            <form action={createApplicationAction} className="flex items-end gap-3 mt-3">
              <input type="hidden" name="studyOptionId" value={studyOption.id} />
              <input type="hidden" name="studentId" value={studyOption.studentId} />
              <Field label="Notes (optional)">
                <input name="notes" className={inputClass} />
              </Field>
              <Button type="submit" variant="secondary">
                Add application
              </Button>
            </form>
          </details>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle>SOP records</SectionTitle>
        {studyOption.sopRecords.length === 0 ? (
          <EmptyState>No SOP record started.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            {studyOption.sopRecords.map((sop) => (
              <div key={sop.id} className="border border-[var(--paper-line)] rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--ink-soft)]">
                    Created {sop.createdAt.toLocaleDateString()}
                  </span>
                  <Badge color={statusColor(sop.status)}>{humanize(sop.status)}</Badge>
                </div>
                {canEditApplications && (
                  <form action={updateSopStatusAction} className="flex items-end gap-3">
                    <input type="hidden" name="studyOptionId" value={studyOption.id} />
                    <input type="hidden" name="studentId" value={studyOption.studentId} />
                    <input type="hidden" name="sopId" value={sop.id} />
                    <Field label="Status">
                      <select name="status" defaultValue={sop.status} className={inputClass}>
                        {SOP_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {humanize(s)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Button type="submit" variant="secondary">
                      Update
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
        {canEditApplications && (
          <form action={createSopRecordAction} className="flex items-end gap-3">
            <input type="hidden" name="studyOptionId" value={studyOption.id} />
            <input type="hidden" name="studentId" value={studyOption.studentId} />
            <Button type="submit" variant="secondary">
              Start SOP record
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

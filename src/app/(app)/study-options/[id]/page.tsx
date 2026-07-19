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
import {
  createApplicationAction,
  updateApplicationStatusAction,
  recordOfferAction,
  updateOfferStatusAction,
  createSopRecordAction,
  updateSopStatusAction,
  updateStudyOptionStatusAction,
} from "./actions";

const APPLICATION_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "DECIDED", "WITHDRAWN"];
const OFFER_STATUSES = ["CONDITIONAL", "UNCONDITIONAL", "REJECTED", "WITHDRAWN", "DEFERRED"];
const SOP_STATUSES = ["NOT_STARTED", "DRAFTING", "REVIEW", "FINAL"];
const STUDY_OPTION_STATUSES = ["ACTIVE", "ON_HOLD", "WITHDRAWN", "UNSUCCESSFUL", "REJECTED"];

export default async function StudyOptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("COUNSELLOR", "APPLICATIONS_TEAM", "MANAGER");
  const { id } = await params;

  const studyOption = await prisma.studyOption.findUnique({
    where: { id },
    include: {
      student: true,
      country: true,
      assignedCounsellor: true,
      assignedAppsUser: true,
      applications: { include: { offer: true }, orderBy: { createdAt: "desc" } },
      sopRecords: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!studyOption) notFound();

  const canEditApplications = session.role === "APPLICATIONS_TEAM" || session.role === "MANAGER";
  const canEditStatus = session.role === "COUNSELLOR" || session.role === "MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${studyOption.universityName} · ${studyOption.courseName}`}
        description={
          <>
            {studyOption.country.name} · {studyOption.intake} · student:{" "}
            <Link href={`/students/${studyOption.studentId}`} className="underline">
              {studyOption.student.firstName} {studyOption.student.lastName}
            </Link>
          </>
        }
      />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Status</SectionTitle>
          <Badge color={statusColor(studyOption.status)}>{humanize(studyOption.status)}</Badge>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Counsellor: {studyOption.assignedCounsellor?.name ?? "—"} · Applications team:{" "}
          {studyOption.assignedAppsUser?.name ?? "—"}
        </p>
        {canEditStatus && (
          <form action={updateStudyOptionStatusAction} className="flex items-end gap-3">
            <input type="hidden" name="studyOptionId" value={studyOption.id} />
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
              <div key={app.id} className="border border-slate-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900">
                    Application · applied {app.appliedDate.toLocaleDateString()}
                  </p>
                  <Badge color={statusColor(app.status)}>{humanize(app.status)}</Badge>
                </div>
                {canEditApplications && (
                  <form action={updateApplicationStatusAction} className="flex items-end gap-3 mb-3">
                    <input type="hidden" name="studyOptionId" value={studyOption.id} />
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
                  <div className="bg-slate-50 rounded-md p-3 text-sm">
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
                      <form action={updateOfferStatusAction} className="flex items-end gap-3">
                        <input type="hidden" name="studyOptionId" value={studyOption.id} />
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
                    )}
                  </div>
                ) : (
                  canEditApplications && (
                    <details>
                      <summary className="text-sm text-slate-600 cursor-pointer">
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
            <summary className="text-sm text-slate-600 cursor-pointer">
              + Log a new application
            </summary>
            <form action={createApplicationAction} className="flex items-end gap-3 mt-3">
              <input type="hidden" name="studyOptionId" value={studyOption.id} />
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
              <div key={sop.id} className="border border-slate-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">
                    Created {sop.createdAt.toLocaleDateString()}
                  </span>
                  <Badge color={statusColor(sop.status)}>{humanize(sop.status)}</Badge>
                </div>
                {canEditApplications && (
                  <form action={updateSopStatusAction} className="flex items-end gap-3">
                    <input type="hidden" name="studyOptionId" value={studyOption.id} />
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
            <Button type="submit" variant="secondary">
              Start SOP record
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

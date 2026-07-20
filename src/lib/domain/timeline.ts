export type TimelineKind =
  | "enquiry"
  | "conversion"
  | "study"
  | "offer"
  | "country"
  | "visa_case"
  | "visa_attempt"
  | "visa_event"
  | "outcome";

export type TimelineEntry = {
  date: Date;
  label: string;
  description?: string;
  kind: TimelineKind;
  tone?: "positive" | "negative" | "neutral";
  href?: string;
};

type TimelineStudent = {
  enquiryDate: Date;
  createdAt: Date;
  studyOptions: {
    id: string;
    universityName: string;
    courseName: string;
    createdAt: Date;
    applications: {
      offer: { universityName: string; status: string; receivedDate: Date } | null;
    }[];
  }[];
  countryConfirmations: {
    country: { name: string };
    confirmedAt: Date;
    releasedAt: Date | null;
  }[];
  visaCases: {
    id: string;
    country: { name: string };
    visaRoute: { name: string };
    openedAt: Date;
    closedAt: Date | null;
    closeReason: string | null;
    attempts: {
      attemptNumber: number;
      startedAt: Date;
      status: string;
      decidedAt: Date | null;
      events: { type: string; eventDate: Date; notes: string | null }[];
    }[];
  }[];
};

const EVENT_LABEL: Record<string, string> = {
  FILING: "Application filed",
  APPOINTMENT: "Appointment scheduled",
  BIOMETRICS: "Biometrics completed",
  INTERVIEW: "Interview held",
  ADDITIONAL_DOCUMENTS_REQUESTED: "Additional documents requested",
  APPROVAL: "Visa approved",
  REFUSAL: "Visa refused",
  WITHDRAWAL: "Attempt withdrawn",
  NOTE: "Note logged",
};

export function buildStudentTimeline(student: TimelineStudent): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  entries.push({ date: student.enquiryDate, label: "Enquiry received", kind: "enquiry" });

  if (student.createdAt.getTime() !== student.enquiryDate.getTime()) {
    entries.push({ date: student.createdAt, label: "Converted to student", kind: "conversion" });
  }

  for (const so of student.studyOptions) {
    entries.push({
      date: so.createdAt,
      label: `Study option added — ${so.universityName}`,
      description: so.courseName,
      kind: "study",
      href: `/study-options/${so.id}`,
    });
    for (const app of so.applications) {
      if (app.offer) {
        entries.push({
          date: app.offer.receivedDate,
          label: `Offer received — ${app.offer.universityName}`,
          description: app.offer.status.replaceAll("_", " "),
          kind: "offer",
          href: `/study-options/${so.id}`,
        });
      }
    }
  }

  for (const cc of student.countryConfirmations) {
    entries.push({
      date: cc.confirmedAt,
      label: `Country confirmed — ${cc.country.name}`,
      kind: "country",
    });
    if (cc.releasedAt) {
      entries.push({
        date: cc.releasedAt,
        label: `Country route released — ${cc.country.name}`,
        kind: "country",
      });
    }
  }

  for (const vc of student.visaCases) {
    const vcHref = `/visa/${vc.id}`;
    entries.push({
      date: vc.openedAt,
      label: `Visa case opened — ${vc.country.name}`,
      description: vc.visaRoute.name,
      kind: "visa_case",
      href: vcHref,
    });

    for (const attempt of vc.attempts) {
      entries.push({
        date: attempt.startedAt,
        label: `Visa attempt #${attempt.attemptNumber} started`,
        kind: "visa_attempt",
        href: vcHref,
      });
      for (const ev of attempt.events) {
        const isOutcome = ev.type === "APPROVAL" || ev.type === "REFUSAL";
        entries.push({
          date: ev.eventDate,
          label: `${EVENT_LABEL[ev.type] ?? ev.type} — attempt #${attempt.attemptNumber}`,
          description: ev.notes ?? undefined,
          kind: isOutcome ? "outcome" : "visa_event",
          tone: ev.type === "APPROVAL" ? "positive" : ev.type === "REFUSAL" ? "negative" : undefined,
          href: vcHref,
        });
      }
    }

    if (vc.closedAt) {
      entries.push({
        date: vc.closedAt,
        label: `Visa case closed — ${vc.country.name}`,
        description: vc.closeReason?.replaceAll("_", " "),
        kind: "outcome",
        href: vcHref,
      });
    }
  }

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

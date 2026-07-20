export type TimelineKind =
  | "enquiry"
  | "conversion"
  | "study"
  | "offer"
  | "country"
  | "visa_case"
  | "visa_attempt"
  | "visa_event"
  | "outcome"
  | "deadline";

export type TimelineEntry = {
  date: Date;
  label: string;
  description?: string;
  kind: TimelineKind;
  tone?: "positive" | "negative" | "neutral" | "upcoming";
  href?: string;
  // Groups this entry onto its own branch (e.g. a study option id). Entries
  // without a laneKey render on the trunk (lane 0).
  laneKey?: string;
  // For a trunk entry where side branches rejoin (e.g. country confirmed),
  // the laneKeys of the branches merging back in here.
  mergesLaneKeys?: string[];
  // The underlying study option's status, carried on its "study"/"offer"
  // entries so a branch that never merges can still be read as "withdrawn/
  // rejected" (a real dead end) versus "still active, just not decided yet."
  studyOptionStatus?: string;
};

export type LanedTimelineEntry = TimelineEntry & { lane: number; mergesLanes?: number[] };

type TimelineStudent = {
  enquiryDate: Date;
  createdAt: Date;
  studyOptions: {
    id: string;
    countryId: string;
    universityName: string;
    courseName: string;
    status: string;
    createdAt: Date;
    intakeCatalog: { name: string; applicationDeadline: Date | null } | null;
    applications: {
      offer: { universityName: string; status: string; receivedDate: Date } | null;
    }[];
  }[];
  countryConfirmations: {
    countryId: string;
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
    activeOffer: { universityName: string; application: { studyOptionId: string } | null } | null;
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

export function buildStudentTimeline(student: TimelineStudent): LanedTimelineEntry[] {
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
      laneKey: so.id,
      studyOptionStatus: so.status,
    });
    for (const app of so.applications) {
      if (app.offer) {
        entries.push({
          date: app.offer.receivedDate,
          label: `Offer received — ${app.offer.universityName}`,
          description: app.offer.status.replaceAll("_", " "),
          kind: "offer",
          href: `/study-options/${so.id}`,
          laneKey: so.id,
          studyOptionStatus: so.status,
        });
      }
    }

    if (so.intakeCatalog?.applicationDeadline && so.intakeCatalog.applicationDeadline.getTime() >= Date.now()) {
      entries.push({
        date: so.intakeCatalog.applicationDeadline,
        label: `Application deadline — ${so.intakeCatalog.name}`,
        description: `${so.universityName} · ${so.courseName}`,
        kind: "deadline",
        tone: "upcoming",
        href: `/study-options/${so.id}`,
        // Deliberately not laneKey'd to this study option: it's a forward-looking
        // reminder, not branch history, so it renders on the trunk even if the
        // branch itself has already merged in by now.
      });
    }
  }

  for (const cc of student.countryConfirmations) {
    // Confirming a country doesn't yet pick a specific university within it -
    // a student can still be weighing several study options there. So this
    // stays a trunk-only milestone; it doesn't absorb any branch. The actual
    // "this is the one we're pursuing" merge happens below, at whichever
    // study option the eventual visa case's active offer points to - the
    // other study options for that country just dead-end where they are.
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
    const pursuedStudyOptionId = vc.activeOffer?.application?.studyOptionId;
    entries.push({
      date: vc.openedAt,
      label: `Visa application started — ${vc.country.name}`,
      description: pursuedStudyOptionId
        ? `${vc.visaRoute.name} · pursuing ${vc.activeOffer!.universityName}`
        : vc.visaRoute.name,
      kind: "visa_case",
      href: vcHref,
      mergesLaneKeys: pursuedStudyOptionId ? [pursuedStudyOptionId] : undefined,
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
        label: `Visa application closed — ${vc.country.name}`,
        description: vc.closeReason?.replaceAll("_", " "),
        kind: "outcome",
        href: vcHref,
      });
    }
  }

  return assignLanes(entries.sort((a, b) => a.date.getTime() - b.date.getTime()));
}

// Lays entries out onto a trunk (lane 0) plus one branch lane per distinct
// laneKey, in first-seen (chronological) order — the data needed to draw a
// git-graph-style view where study options fork off the trunk and only the
// one actually being pursued (the visa case's active offer) rejoins it;
// every other study option for that country simply dead-ends where it is.
function assignLanes(entries: TimelineEntry[]): LanedTimelineEntry[] {
  const laneOf = new Map<string, number>();
  let nextLane = 1;

  return entries.map((entry) => {
    let lane = 0;
    if (entry.laneKey) {
      if (!laneOf.has(entry.laneKey)) laneOf.set(entry.laneKey, nextLane++);
      lane = laneOf.get(entry.laneKey)!;
    }

    const mergesLanes = entry.mergesLaneKeys
      ?.map((key) => laneOf.get(key))
      .filter((l): l is number => typeof l === "number" && l !== 0);

    return { ...entry, lane, mergesLanes: mergesLanes && mergesLanes.length > 0 ? mergesLanes : undefined };
  });
}

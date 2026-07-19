import type { BadgeColor } from "@/components/ui";

export type StudentStage =
  | "New"
  | "Exploring Options"
  | "Offer Received"
  | "Country Confirmed"
  | "Visa In Progress"
  | "Visa Refused"
  | "Visa Approved"
  | "Closed";

export type StudentStageInput = {
  studyOptions: { id: string }[];
  offers: { status: string }[];
  countryConfirmations: { releasedAt: Date | null }[];
  visaCases: {
    lifecycleStatus: string;
    attempts: { status: string }[];
  }[];
};

const ACTIVE_ATTEMPT_STATUSES = new Set([
  "DOCUMENTS_PENDING",
  "READY_TO_FILE",
  "SUBMITTED",
  "BIOMETRICS_PENDING",
  "INTERVIEW_PENDING",
  "ADDITIONAL_DOCUMENTS",
  "DECISION_PENDING",
]);

const OFFER_RECEIVED_STATUSES = new Set(["CONDITIONAL", "UNCONDITIONAL", "ACCEPTED"]);

// Priority order, most-advanced first: a student's overall stage is the
// furthest point reached across all of their (possibly parallel) visa cases.
export function computeStudentStage(s: StudentStageInput): StudentStage {
  const cases = s.visaCases.map((vc) => ({
    lifecycleStatus: vc.lifecycleStatus,
    latest: vc.attempts[0]?.status,
  }));

  if (cases.some((c) => c.latest === "APPROVED")) return "Visa Approved";

  if (cases.some((c) => c.lifecycleStatus === "OPEN" && c.latest && ACTIVE_ATTEMPT_STATUSES.has(c.latest))) {
    return "Visa In Progress";
  }

  if (cases.some((c) => c.lifecycleStatus === "OPEN" && c.latest === "REFUSED")) {
    return "Visa Refused";
  }

  if (s.countryConfirmations.some((cc) => cc.releasedAt === null)) return "Country Confirmed";

  if (s.visaCases.length > 0) return "Closed";

  if (s.offers.some((o) => OFFER_RECEIVED_STATUSES.has(o.status))) return "Offer Received";

  if (s.studyOptions.length > 0) return "Exploring Options";

  return "New";
}

export function stageColor(stage: StudentStage): BadgeColor {
  switch (stage) {
    case "New":
      return "slate";
    case "Exploring Options":
      return "blue";
    case "Offer Received":
      return "amber";
    case "Country Confirmed":
      return "purple";
    case "Visa In Progress":
      return "amber";
    case "Visa Refused":
      return "red";
    case "Visa Approved":
      return "green";
    case "Closed":
      return "slate";
  }
}

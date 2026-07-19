export const STATUS_COLOR: Record<string, string> = {
  // Lead
  OPEN: "blue",
  CONVERTED: "green",
  LOST: "slate",
  // Study option
  ACTIVE: "blue",
  ON_HOLD: "amber",
  WITHDRAWN: "slate",
  UNSUCCESSFUL: "red",
  REJECTED: "red",
  // Application
  SUBMITTED: "blue",
  UNDER_REVIEW: "amber",
  DECIDED: "green",
  // SOP
  NOT_STARTED: "slate",
  DRAFTING: "amber",
  REVIEW: "blue",
  FINAL: "green",
  // Offer
  CONDITIONAL: "amber",
  UNCONDITIONAL: "green",
  DEFERRED: "purple",
  // Visa case lifecycle
  CLOSED: "slate",
  // Visa attempt
  DOCUMENTS_PENDING: "amber",
  READY_TO_FILE: "blue",
  BIOMETRICS_PENDING: "blue",
  INTERVIEW_PENDING: "blue",
  ADDITIONAL_DOCUMENTS: "amber",
  DECISION_PENDING: "purple",
  APPROVED: "green",
  REFUSED: "red",
  // Work item
  IN_PROGRESS: "blue",
  BLOCKED: "red",
  DONE: "green",
  // Priority
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  URGENT: "red",
  // Checklist
  PENDING: "amber",
  RECEIVED: "blue",
  VERIFIED: "green",
  WAIVED: "slate",
};

export function statusColor(status: string) {
  return (STATUS_COLOR[status] ?? "slate") as
    | "slate"
    | "green"
    | "red"
    | "amber"
    | "blue"
    | "purple";
}

export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

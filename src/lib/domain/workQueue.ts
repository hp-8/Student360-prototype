export type QueueCounts = {
  assigned: number;
  overdue: number;
  blocked: number;
  completed: number;
};

type QueueItem = {
  status: string;
  dueDate: Date | null;
};

// "Assigned" here means the open queue size (not yet DONE) - the number of
// items a department/person currently has in front of them, regardless of
// whether every item has a named assignee.
export function computeQueueCounts(items: QueueItem[], now: Date = new Date()): QueueCounts {
  let assigned = 0;
  let overdue = 0;
  let blocked = 0;
  let completed = 0;

  for (const item of items) {
    if (item.status === "DONE") {
      completed++;
      continue;
    }
    assigned++;
    if (item.status === "BLOCKED") blocked++;
    if (item.dueDate && item.dueDate.getTime() < now.getTime()) overdue++;
  }

  return { assigned, overdue, blocked, completed };
}

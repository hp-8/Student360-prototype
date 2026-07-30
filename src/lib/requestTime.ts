import "server-only";
import { connection } from "next/server";

// Reading the clock is impure, so it must not happen inside a component body.
// Page components call this once and thread the result through, which also
// means every "is this overdue / recent" comparison on a page is measured
// against the same instant instead of drifting between calls.
//
// `connection()` marks the caller as request-time, so a page that only needs
// the clock (and no cookies/headers) is still excluded from prerendering.
export async function requestTime(): Promise<Date> {
  await connection();
  return new Date();
}

import { NextRequest, NextResponse } from "next/server";
import { clearMockCaseData } from "@/lib/domain/dataReset";

// Wipes all students/leads/case data (study options, offers, visa cases,
// documents, notes, work items, notifications, audit logs) while leaving
// staff logins, branches, countries, visa routes, requirement templates, and
// intakes in place. Gated by the same shared secret as /api/seed.
async function run(providedSecret: string | null) {
  const expected = process.env.SEED_SECRET;

  if (!expected || providedSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await clearMockCaseData();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return run(request.headers.get("x-seed-secret"));
}

// GET support so this can be triggered by visiting a URL directly in a
// browser, same as /api/seed.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  return run(secret);
}

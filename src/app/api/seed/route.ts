import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "../../../../prisma/seedData";

async function runSeed(providedSecret: string | null) {
  const expected = process.env.SEED_SECRET;

  if (!expected || providedSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDatabase();
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return runSeed(request.headers.get("x-seed-secret"));
}

// GET support exists so the seed can be triggered by visiting a URL directly
// in a browser (no terminal/curl needed) — gated by the same shared secret.
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  return runSeed(secret);
}

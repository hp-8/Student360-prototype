import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "../../../../prisma/seedData";

export async function POST(request: NextRequest) {
  const provided = request.headers.get("x-seed-secret");
  const expected = process.env.SEED_SECRET;

  if (!expected || provided !== expected) {
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

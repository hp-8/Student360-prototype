import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary one-off recovery endpoint: clears the blocking record left by a
// migration that failed partway on a non-empty database, so a subsequent
// `prisma migrate deploy` (once re-enabled in vercel-build) can retry it
// cleanly. Safe to remove once used.
async function run(providedSecret: string | null) {
  const expected = process.env.SEED_SECRET;
  if (!expected || providedSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const before = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT migration_name, started_at, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at DESC`
    );

    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20260719162156_multi_role_hierarchy_intake_fields'`
    );

    const after = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT migration_name, started_at, finished_at, applied_steps_count FROM "_prisma_migrations" ORDER BY started_at DESC`
    );

    return NextResponse.json({ ok: true, deletedRows: deleted, before, after });
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

export async function GET(request: NextRequest) {
  return run(request.nextUrl.searchParams.get("secret"));
}

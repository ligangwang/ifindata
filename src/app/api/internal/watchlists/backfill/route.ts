import { isInternalRequest } from "@/lib/firebase/auth";
import { backfillLegacyPredictionWatchlists } from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

type BackfillRequest = {
  dryRun?: unknown;
  limit?: unknown;
  defaultName?: unknown;
};

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as BackfillRequest;
    const result = await backfillLegacyPredictionWatchlists({
      dryRun: readBoolean(payload.dryRun),
      limit: Number.isFinite(payload.limit) ? Number(payload.limit) : undefined,
      defaultName: readString(payload.defaultName),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to backfill watchlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

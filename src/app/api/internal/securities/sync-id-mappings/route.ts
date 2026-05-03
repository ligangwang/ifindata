import { isInternalRequest } from "@/lib/firebase/auth";
import { syncEodhdIdMappings } from "@/lib/securities/eodhd-id-mapping";
import { NextRequest, NextResponse } from "next/server";

type SyncIdMappingsRequest = {
  exchange?: unknown;
  pageLimit?: unknown;
  pageOffset?: unknown;
  maxPages?: unknown;
  dryRun?: unknown;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as SyncIdMappingsRequest;
    const result = await syncEodhdIdMappings({
      exchange: readString(payload.exchange),
      pageLimit: readNumber(payload.pageLimit),
      pageOffset: readNumber(payload.pageOffset),
      maxPages: readNumber(payload.maxPages),
      dryRun: readBoolean(payload.dryRun),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync security ID mappings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

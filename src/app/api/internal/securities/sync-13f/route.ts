import { isInternalRequest } from "@/lib/firebase/auth";
import { syncLatest13FHoldings } from "@/lib/securities/thirteen-f";
import { NextRequest, NextResponse } from "next/server";

type Sync13FRequest = {
  managerCiks?: unknown;
  dryRun?: unknown;
};

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readManagerCiks(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Sync13FRequest;
    const result = await syncLatest13FHoldings({
      managerCiks: readManagerCiks(payload.managerCiks),
      dryRun: readBoolean(payload.dryRun),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync 13F holdings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

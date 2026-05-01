import { isInternalRequest } from "@/lib/firebase/auth";
import {
  normalizeCompanyGraphQueueLimit,
  processQueuedCompanyGraphRequests,
} from "@/lib/company-graph/queue-worker";
import { NextRequest, NextResponse } from "next/server";

type ProcessQueueRequest = {
  limit?: unknown;
  force?: unknown;
};

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as ProcessQueueRequest;
    const result = await processQueuedCompanyGraphRequests({
      limit: normalizeCompanyGraphQueueLimit(payload.limit),
      force: readBoolean(payload.force),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process company graph queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

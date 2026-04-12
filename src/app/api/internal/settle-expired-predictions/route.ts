import { isInternalRequest } from "@/lib/firebase/auth";
import { settleExpiredPredictions } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

type SettleRequest = {
  limit?: number;
};

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as SettleRequest;
    const limit = Number.isFinite(payload.limit) ? Number(payload.limit) : 100;
    const result = await settleExpiredPredictions(limit);

    return NextResponse.json({
      ok: true,
      settled: result.settled,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to settle expired predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
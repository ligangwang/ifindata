import { enqueueCompanyGraphRequest } from "@/lib/company-graph/requests";
import { NextRequest, NextResponse } from "next/server";

type CompanyGraphRequestPayload = {
  ticker?: unknown;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as CompanyGraphRequestPayload;
    const ticker = readString(payload.ticker);

    if (!ticker) {
      return NextResponse.json({ error: "ticker is required" }, { status: 400 });
    }

    const result = await enqueueCompanyGraphRequest(ticker);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to queue company graph request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

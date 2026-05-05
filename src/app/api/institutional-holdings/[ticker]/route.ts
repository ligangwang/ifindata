import { NextResponse } from "next/server";
import { getInstitutionalTickerSummary } from "@/lib/securities/institutional-data";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await context.params;

  try {
    const summary = await getInstitutionalTickerSummary(ticker);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load institutional holdings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

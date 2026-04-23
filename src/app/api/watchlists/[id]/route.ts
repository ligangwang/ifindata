import { getWatchlistDetail } from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const watchlist = await getWatchlistDetail(id);
    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    return NextResponse.json({ watchlist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watchlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

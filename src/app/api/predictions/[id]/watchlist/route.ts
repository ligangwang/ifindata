import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { movePredictionToWatchlist } from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

type MovePredictionWatchlistRequest = {
  watchlistId?: unknown;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as MovePredictionWatchlistRequest;
    const watchlistId = typeof body.watchlistId === "string" ? body.watchlistId.trim() : "";
    if (!watchlistId) {
      return NextResponse.json({ error: "watchlistId is required" }, { status: 400 });
    }

    const result = await movePredictionToWatchlist(id, watchlistId, { uid: decoded.uid });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to move prediction";
    const status = /forbidden/i.test(message)
      ? 403
      : /not found/i.test(message)
        ? 404
        : /required|must|invalid/i.test(message)
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

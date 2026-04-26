import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import {
  getWatchlistDetail,
  updateWatchlist,
  validateUpdateWatchlistInput,
} from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const decoded = await getDecodedUserFromRequest(request);
    const watchlist = await getWatchlistDetail(id, { viewerUserId: decoded?.uid ?? null });
    if (!watchlist) {
      return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
    }

    return NextResponse.json({ watchlist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watchlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const input = validateUpdateWatchlistInput(await request.json());
    const result = await updateWatchlist(id, input, { uid: decoded.uid });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update watchlist";
    const isValidationError =
      /required|must|invalid|enabled/i.test(message) ||
      /public watchlists cannot be made private/i.test(message);
    const status = /forbidden/i.test(message)
      ? 403
      : /not found/i.test(message)
        ? 404
        : isValidationError
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

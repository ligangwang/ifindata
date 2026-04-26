import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import {
  createWatchlist,
  listWatchlistsForUser,
  validateCreateWatchlistInput,
} from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const decoded = await getDecodedUserFromRequest(request);
    const items = await listWatchlistsForUser(userId, { includePrivate: Boolean(decoded && decoded.uid === userId) });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load watchlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const input = validateCreateWatchlistInput(payload);
    const created = await createWatchlist(input, { uid: decoded.uid });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create watchlist";
    const status =
      message.includes("required") ||
      message.includes("must") ||
      message.includes("Invalid") ||
      message.includes("enabled") ||
      message.includes("limit")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

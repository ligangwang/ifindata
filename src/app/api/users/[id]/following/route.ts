import { getAdminFirestore } from "@/lib/firebase/admin";
import { listFollowUsers } from "@/lib/users/follow-lists";
import { NextRequest, NextResponse } from "next/server";

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "25");
  if (!Number.isFinite(parsed)) {
    return 25;
  }

  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function parseCursor(raw: string | null): string | undefined {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const cursorCreatedAt = parseCursor(request.nextUrl.searchParams.get("cursorCreatedAt"));
  const db = getAdminFirestore();

  try {
    const result = await listFollowUsers(db, id, "following", limit, cursorCreatedAt);

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch following";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

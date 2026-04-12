import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { listPredictions } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

type UserStats = {
  totalPredictions: number;
  activePredictions: number;
  settledPredictions: number;
  totalScore: number;
};

function coerceStats(raw: unknown): UserStats {
  const source = (raw ?? {}) as Record<string, unknown>;

  return {
    totalPredictions: Number(source.totalPredictions ?? 0),
    activePredictions: Number(source.activePredictions ?? 0),
    settledPredictions: Number(source.settledPredictions ?? 0),
    totalScore: Number(source.totalScore ?? 0),
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = getAdminFirestore();

  try {
    const userSnapshot = await db.collection("users").doc(id).get();
    if (!userSnapshot.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnapshot.data() as Record<string, unknown>;
    const isPublic = userData.settings && typeof userData.settings === "object"
      ? (userData.settings as Record<string, unknown>).isPublic === true
      : false;

    const decoded = await getDecodedUserFromRequest(request);
    const isOwner = Boolean(decoded && decoded.uid === id);

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const predictions = await listPredictions({
      userId: id,
      includePrivate: isOwner,
      limit: 25,
      cursorCreatedAt: request.nextUrl.searchParams.get("cursorCreatedAt") ?? undefined,
    });

    return NextResponse.json({
      profile: {
        id,
        displayName: userData.displayName ?? null,
        photoURL: userData.photoURL ?? null,
        bio: userData.bio ?? "",
        stats: coerceStats(userData.stats),
        settings: {
          isPublic,
        },
      },
      predictions: predictions.items,
      nextCursor: predictions.nextCursor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

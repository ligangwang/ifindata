import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { sanitizePredictionThesis } from "@/lib/predictions/types";
import { NextRequest, NextResponse } from "next/server";

async function resolvePreferredAuthorName(
  db: FirebaseFirestore.Firestore,
  userId: unknown,
  fallbackName: unknown,
): Promise<string | null> {
  const fallback = typeof fallbackName === "string" && fallbackName.trim() ? fallbackName.trim() : null;
  const resolvedUserId = typeof userId === "string" ? userId.trim() : "";

  if (!resolvedUserId) {
    return fallback;
  }

  const userSnapshot = await db.collection("users").doc(resolvedUserId).get();
  const userData = userSnapshot.data() as Record<string, unknown> | undefined;
  const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";

  return nickname || fallback;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = getAdminFirestore();

  try {
    const snapshot = await db.collection("predictions").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const prediction = snapshot.data() as Record<string, unknown>;
    const visibility = prediction.visibility;
    const userId = prediction.userId;

    if (visibility !== "PUBLIC") {
      const decoded = await getDecodedUserFromRequest(request);
      if (!decoded || decoded.uid !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const authorDisplayName = await resolvePreferredAuthorName(
      db,
      prediction.userId,
      prediction.authorDisplayName,
    );

    const userId = typeof prediction.userId === "string" ? prediction.userId.trim() : "";
    let authorNickname: string | null = null;
    if (userId) {
      const userSnapshot = await db.collection("users").doc(userId).get();
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";
      authorNickname = nickname || null;
    }

    return NextResponse.json({
      id: snapshot.id,
      ...prediction,
      authorDisplayName: prediction.authorDisplayName,
      authorNickname,
      thesis: sanitizePredictionThesis(typeof prediction.thesis === "string" ? prediction.thesis : ""),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch prediction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

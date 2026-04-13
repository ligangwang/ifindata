import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { sanitizePredictionThesis } from "@/lib/predictions/types";
import { NextRequest, NextResponse } from "next/server";

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
    const predictionUserId = typeof prediction.userId === "string" ? prediction.userId.trim() : "";
    const authorDisplayName =
      typeof prediction.authorDisplayName === "string" && prediction.authorDisplayName.trim()
        ? prediction.authorDisplayName.trim()
        : null;

    if (visibility !== "PUBLIC") {
      const decoded = await getDecodedUserFromRequest(request);
      if (!decoded || !predictionUserId || decoded.uid !== predictionUserId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    let authorNickname: string | null = null;
    if (predictionUserId) {
      const userSnapshot = await db.collection("users").doc(predictionUserId).get();
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";
      authorNickname = nickname || null;
    }

    return NextResponse.json({
      id: snapshot.id,
      ...prediction,
      authorDisplayName,
      authorNickname,
      thesis: sanitizePredictionThesis(typeof prediction.thesis === "string" ? prediction.thesis : ""),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch prediction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

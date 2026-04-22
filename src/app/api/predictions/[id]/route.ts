import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getAiAnalystPublicProfileForUser } from "@/lib/ai-analyst/config";
import { canonicalPredictionStatus, sanitizePredictionThesis, sanitizePredictionThesisTitle } from "@/lib/predictions/types";
import { updatePredictionDetails, validateUpdatePredictionInput } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

function statusFromError(message: string): number {
  if (/not found/i.test(message)) {
    return 404;
  }
  if (/forbidden/i.test(message)) {
    return 403;
  }
  if (/required|must|invalid|only open/i.test(message)) {
    return 400;
  }
  return 500;
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
    const predictionUserId = typeof prediction.userId === "string" ? prediction.userId.trim() : "";
    const authorDisplayName =
      typeof prediction.authorDisplayName === "string" && prediction.authorDisplayName.trim()
        ? prediction.authorDisplayName.trim()
        : null;

    if (prediction.status === "CANCELED") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (visibility !== "PUBLIC") {
      const decoded = await getDecodedUserFromRequest(request);
      if (!decoded || !predictionUserId || decoded.uid !== predictionUserId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    let authorNickname: string | null = null;
    let authorAccountType: "HUMAN" | "AI_ANALYST" | null = null;
    let authorAiAnalystTheme: "AI_CHIPS" | null = null;
    if (predictionUserId) {
      const userSnapshot = await db.collection("users").doc(predictionUserId).get();
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";
      const aiAnalystProfile = getAiAnalystPublicProfileForUser(userData);
      authorNickname = nickname || null;
      authorAccountType = userData?.accountType === "AI_ANALYST" ? "AI_ANALYST" : "HUMAN";
      authorAiAnalystTheme = aiAnalystProfile?.theme ?? null;
    }

    return NextResponse.json({
      id: snapshot.id,
      ...prediction,
      status: canonicalPredictionStatus(prediction.status) ?? "CREATED",
      authorDisplayName,
      authorNickname,
      authorAccountType,
      authorAiAnalystTheme,
      thesisTitle: sanitizePredictionThesisTitle(typeof prediction.thesisTitle === "string" ? prediction.thesisTitle : ""),
      thesis: sanitizePredictionThesis(typeof prediction.thesis === "string" ? prediction.thesis : ""),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch prediction";
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
  const db = getAdminFirestore();

  try {
    const snapshot = await db.collection("predictions").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const prediction = snapshot.data() as Record<string, unknown>;
    const baseDate =
      typeof prediction.entryTargetDate === "string" && prediction.entryTargetDate
        ? prediction.entryTargetDate
        : typeof prediction.createdAt === "string"
          ? prediction.createdAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10);
    const input = validateUpdatePredictionInput(await request.json(), baseDate);
    const result = await updatePredictionDetails(id, input, {
      uid: decoded.uid,
      displayName: decoded.name,
      photoURL: decoded.picture,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update prediction";
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminUser } from "@/lib/firebase/admin-role";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { createPredictionForUser } from "@/lib/predictions/service";
import { type CreatePredictionInput } from "@/lib/predictions/types";
import { getOrCreateDefaultWatchlistForUser } from "@/lib/watchlists/service";
import { NextRequest, NextResponse } from "next/server";

type DraftMutationRequest = {
  action?: unknown;
  reason?: unknown;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function statusFromError(message: string): number {
  if (/unauthorized/i.test(message)) {
    return 401;
  }
  if (/forbidden/i.test(message)) {
    return 403;
  }
  if (/not found/i.test(message)) {
    return 404;
  }
  if (/duplicate prediction|duplicate open prediction/i.test(message)) {
    return 409;
  }
  if (/required|must|invalid/i.test(message)) {
    return 400;
  }
  return 500;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!await isAdminUser(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as DraftMutationRequest;
    const action = body.action === "approve" || body.action === "reject" ? body.action : null;
    const reason = stringOrNull(body.reason);

    if (!action) {
      return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const draftRef = db.collection("ai_prediction_drafts").doc(id);
    const draftSnapshot = await draftRef.get();

    if (!draftSnapshot.exists) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const draft = draftSnapshot.data() as Record<string, unknown>;
    const nowIso = new Date().toISOString();
    const currentStatus = stringOrNull(draft.status);

    if (currentStatus === "APPROVED" || currentStatus === "REJECTED" || currentStatus === "PUBLISHED") {
      return NextResponse.json({ error: `Draft already ${currentStatus?.toLowerCase()}` }, { status: 409 });
    }

    if (action === "reject") {
      await draftRef.set({
        status: "REJECTED",
        updatedAt: nowIso,
        review: {
          action: "REJECTED",
          reviewedAt: nowIso,
          reviewedBy: decoded.uid,
          reason,
        },
      }, { merge: true });

      return NextResponse.json({ ok: true, status: "REJECTED" });
    }

    const analystUserId = stringOrNull(draft.analystUserId);
    const ticker = stringOrNull(draft.ticker);
    const direction = draft.direction === "UP" || draft.direction === "DOWN" ? draft.direction : null;
    const thesisTitle = stringOrNull(draft.thesisTitle);
    const thesis = stringOrNull(draft.thesis);
    const timeHorizon = draft.timeHorizon && typeof draft.timeHorizon === "object"
      ? draft.timeHorizon as CreatePredictionInput["timeHorizon"]
      : null;

    if (!analystUserId || !ticker || !direction || !thesisTitle || !thesis || !timeHorizon) {
      return NextResponse.json({ error: "Draft is missing required prediction fields." }, { status: 400 });
    }

    const analystSnapshot = await db.collection("users").doc(analystUserId).get();
    if (!analystSnapshot.exists) {
      return NextResponse.json({ error: "AI analyst account not found." }, { status: 404 });
    }

    const analyst = analystSnapshot.data() as Record<string, unknown>;
    const watchlistId = await getOrCreateDefaultWatchlistForUser(analystUserId, "AI Analyst Calls");
    const created = await createPredictionForUser(
      {
        ticker,
        direction,
        watchlistId,
        thesisTitle,
        thesis,
        timeHorizon,
        visibility: "PUBLIC",
      },
      {
        uid: analystUserId,
        displayName: stringOrNull(analyst.displayName),
        photoURL: stringOrNull(analyst.photoURL),
      },
      {
        sourceType: "AI_ANALYST",
        generation: {
          confidence: typeof draft.confidence === "number" ? draft.confidence : null,
          catalyst: stringOrNull(draft.catalyst),
          model:
            draft.generation && typeof draft.generation === "object"
              ? stringOrNull((draft.generation as Record<string, unknown>).model)
              : null,
          promptVersion:
            draft.generation && typeof draft.generation === "object"
              ? stringOrNull((draft.generation as Record<string, unknown>).promptVersion)
              : null,
          generatedAt: stringOrNull(draft.createdAt),
          approvalStatus: "PUBLISHED",
        },
      },
    );

    await draftRef.set({
      status: "PUBLISHED",
      updatedAt: nowIso,
      publishedPredictionId: created.id,
      review: {
        action: "APPROVED",
        reviewedAt: nowIso,
        reviewedBy: decoded.uid,
        reason,
      },
    }, { merge: true });

    return NextResponse.json({
      ok: true,
      status: "PUBLISHED",
      predictionId: created.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update AI draft.";
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

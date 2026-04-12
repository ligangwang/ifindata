import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { addComment } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

type CommentRequestBody = {
  content?: string;
};

function mapCommentDoc(
  predictionId: string,
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): { id: string; predictionId: string } & Record<string, unknown> {
  const data = doc.data();
  const resolvedPredictionId =
    typeof data.predictionId === "string" && data.predictionId.trim()
      ? data.predictionId
      : predictionId;

  return {
    id: doc.id,
    ...data,
    predictionId: resolvedPredictionId,
  };
}

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "30");
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

function isMissingIndexError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  return (
    code === 9 ||
    /requires an index|failed precondition|query requires an index/i.test(error.message)
  );
}

async function listCommentsWithFallback(
  predictionRef: FirebaseFirestore.DocumentReference,
  limit: number,
) {
  const predictionId = predictionRef.id;

  try {
    const snapshot = await predictionRef
      .collection("comments")
      .where("isDeleted", "==", false)
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => mapCommentDoc(predictionId, doc));
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    const items: Array<Record<string, unknown> & { id: string }> = [];
    const batchSize = Math.max(limit, 25);
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

    while (items.length < limit) {
      let query = predictionRef.collection("comments").orderBy("createdAt", "asc").limit(batchSize);
      if (cursor) {
        query = query.startAfter(cursor);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        break;
      }

      for (const doc of snapshot.docs) {
        if (doc.get("isDeleted") === false) {
          items.push(mapCommentDoc(predictionId, doc));
        }

        if (items.length >= limit) {
          break;
        }
      }

      cursor = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.docs.length < batchSize) {
        break;
      }
    }

    return items;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const db = getAdminFirestore();
  const { id } = await context.params;

  try {
    const predictionSnapshot = await db.collection("predictions").doc(id).get();
    if (!predictionSnapshot.exists) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const prediction = predictionSnapshot.data() as Record<string, unknown>;
    if (prediction.visibility !== "PUBLIC") {
      const decoded = await getDecodedUserFromRequest(request);
      if (!decoded || decoded.uid !== prediction.userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const items = await listCommentsWithFallback(predictionSnapshot.ref, limit);

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch comments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const payload = (await request.json()) as CommentRequestBody;
    const created = await addComment(id, payload.content ?? "", {
      uid: decoded.uid,
      displayName: decoded.name,
      photoURL: decoded.picture,
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create comment";
    const status = message.includes("not found") || message.includes("required") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
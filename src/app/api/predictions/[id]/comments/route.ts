import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { addComment } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

type CommentRequestBody = {
  content?: string;
};

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "30");
  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
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
    const snapshot = await predictionSnapshot.ref
      .collection("comments")
      .where("isDeleted", "==", false)
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    return NextResponse.json({
      items: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
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
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { isAdminUser } from "@/lib/firebase/admin-role";
import { NextRequest, NextResponse } from "next/server";

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "25");
  if (!Number.isFinite(parsed)) {
    return 25;
  }
  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

export async function GET(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!await isAdminUser(decoded)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const snapshot = await getAdminFirestore()
      .collection("ai_prediction_drafts")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return NextResponse.json({
      drafts: snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load AI analyst drafts.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


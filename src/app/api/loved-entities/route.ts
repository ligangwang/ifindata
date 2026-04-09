import { verifyIdToken } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import {
  addLovedEntity,
  removeLovedEntity,
  getLovedEntities,
  isEntityLoved,
} from "@/lib/firebase/loved-entities";

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entityType = request.nextUrl.searchParams.get("type") || "company";

  try {
    const entities = await getLovedEntities(userId, entityType);
    return NextResponse.json({ entities });
  } catch (error) {
    console.error("Failed to fetch loved entities:", error);
    return NextResponse.json({ error: "Failed to fetch loved entities" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { entityId, entityType = "company", action } = await request.json();

    if (!entityId || !["add", "remove", "check"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "add") {
      await addLovedEntity(userId, entityId, entityType);
      return NextResponse.json({ success: true, action: "added" });
    }

    if (action === "remove") {
      await removeLovedEntity(userId, entityId, entityType);
      return NextResponse.json({ success: true, action: "removed" });
    }

    if (action === "check") {
      const isLoved = await isEntityLoved(userId, entityId, entityType);
      return NextResponse.json({ isLoved });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update loved entity:", error);
    return NextResponse.json({ error: "Failed to update loved entity" }, { status: 500 });
  }
}

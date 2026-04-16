import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function followPayload(userId: string, data: Record<string, unknown>, createdAt: string) {
  return {
    userId,
    displayName: stringOrNull(data.displayName),
    nickname: stringOrNull(data.nickname),
    photoURL: stringOrNull(data.photoURL),
    createdAt,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decoded.uid === id) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const viewerRef = db.collection("users").doc(decoded.uid);
    const targetRef = db.collection("users").doc(id);
    const followingRef = viewerRef.collection("following").doc(id);
    const followerRef = targetRef.collection("followers").doc(decoded.uid);
    const nowIso = new Date().toISOString();

    const result = await db.runTransaction(async (tx) => {
      const [viewerSnapshot, targetSnapshot, followingSnapshot] = await Promise.all([
        tx.get(viewerRef),
        tx.get(targetRef),
        tx.get(followingRef),
      ]);

      if (!viewerSnapshot.exists) {
        return { status: "viewer-not-found" as const };
      }

      if (!targetSnapshot.exists) {
        return { status: "target-not-found" as const };
      }

      if (followingSnapshot.exists) {
        return { status: "unchanged" as const };
      }

      const viewerData = viewerSnapshot.data() as Record<string, unknown>;
      const targetData = targetSnapshot.data() as Record<string, unknown>;

      tx.set(followingRef, followPayload(id, targetData, nowIso));
      tx.set(followerRef, followPayload(decoded.uid, viewerData, nowIso));
      tx.update(viewerRef, {
        updatedAt: nowIso,
        "stats.followingCount": FieldValue.increment(1),
      });
      tx.update(targetRef, {
        updatedAt: nowIso,
        "stats.followersCount": FieldValue.increment(1),
      });

      return { status: "followed" as const };
    });

    if (result.status === "viewer-not-found") {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (result.status === "target-not-found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ isFollowing: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to follow user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decoded.uid === id) {
    return NextResponse.json({ error: "You cannot unfollow yourself" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const viewerRef = db.collection("users").doc(decoded.uid);
    const targetRef = db.collection("users").doc(id);
    const followingRef = viewerRef.collection("following").doc(id);
    const followerRef = targetRef.collection("followers").doc(decoded.uid);
    const nowIso = new Date().toISOString();

    const result = await db.runTransaction(async (tx) => {
      const [viewerSnapshot, targetSnapshot, followingSnapshot] = await Promise.all([
        tx.get(viewerRef),
        tx.get(targetRef),
        tx.get(followingRef),
      ]);

      if (!viewerSnapshot.exists) {
        return { status: "viewer-not-found" as const };
      }

      if (!targetSnapshot.exists) {
        return { status: "target-not-found" as const };
      }

      if (!followingSnapshot.exists) {
        return { status: "unchanged" as const };
      }

      tx.delete(followingRef);
      tx.delete(followerRef);
      tx.update(viewerRef, {
        updatedAt: nowIso,
        "stats.followingCount": FieldValue.increment(-1),
      });
      tx.update(targetRef, {
        updatedAt: nowIso,
        "stats.followersCount": FieldValue.increment(-1),
      });

      return { status: "unfollowed" as const };
    });

    if (result.status === "viewer-not-found") {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    if (result.status === "target-not-found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ isFollowing: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unfollow user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

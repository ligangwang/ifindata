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
    const decoded = await getDecodedUserFromRequest(request);
    const isOwner = Boolean(decoded && decoded.uid === id);

    const statusParam = request.nextUrl.searchParams.get("status");
    const status = statusParam === "ACTIVE" || statusParam === "SETTLED" ? statusParam : undefined;

    const predictions = await listPredictions({
      userId: id,
      includePrivate: isOwner,
      status,
      limit: 25,
      cursorCreatedAt: request.nextUrl.searchParams.get("cursorCreatedAt") ?? undefined,
    });

    const userSnapshot = await db.collection("users").doc(id).get();

    if (!userSnapshot.exists) {
      // If user document doesn't exist, check if they have predictions
      // If they do, create a minimal profile from prediction data
      if (predictions.items.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Build profile from first prediction's author data and create user doc
      const firstPrediction = predictions.items[0];
      const profileData = {
        displayName: firstPrediction.authorDisplayName ?? null,
        photoURL: firstPrediction.authorPhotoURL ?? null,
        authProviders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bio: "",
        nickname: null,
        stats: {
          totalPredictions: 0,
          activePredictions: 0,
          settledPredictions: 0,
          totalScore: 0,
        },
        settings: {
          isPublic: true,
        },
      };

      // Create the user profile document if it doesn't exist
      try {
        await db.collection("users").doc(id).set(profileData, { merge: true });
      } catch {
        // If set fails, continue anyway - we have the data to return
      }

      return NextResponse.json({
        profile: {
          id,
          displayName: profileData.displayName,
          photoURL: profileData.photoURL,
          nickname: profileData.nickname,
          bio: profileData.bio,
          stats: profileData.stats,
          settings: profileData.settings,
        },
        predictions: predictions.items,
        nextCursor: predictions.nextCursor,
      });
    }

    const userData = userSnapshot.data() as Record<string, unknown>;
    const isPublic = userData.settings && typeof userData.settings === "object"
      ? (userData.settings as Record<string, unknown>).isPublic !== false
      : true;

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id,
        displayName: userData.displayName ?? null,
        photoURL: userData.photoURL ?? null,
        nickname: typeof userData.nickname === "string" ? userData.nickname : null,
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded || decoded.uid !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if ("nickname" in body) {
    const nickname = body.nickname;
    if (nickname !== null && (typeof nickname !== "string" || nickname.length > 30)) {
      return NextResponse.json({ error: "nickname must be a string up to 30 characters or null" }, { status: 400 });
    }
    updates.nickname = nickname === "" ? null : nickname;
  }

  if ("bio" in body) {
    const bio = body.bio;
    if (typeof bio !== "string" || bio.length > 500) {
      return NextResponse.json({ error: "bio must be a string up to 500 characters" }, { status: 400 });
    }
    updates.bio = bio;
  }

  if ("settings" in body && body.settings && typeof body.settings === "object") {
    const settings = body.settings as Record<string, unknown>;
    if (typeof settings.isPublic === "boolean") {
      updates["settings.isPublic"] = settings.isPublic;
    }
  }

  try {
    const db = getAdminFirestore();
    await db.collection("users").doc(id).update(updates);
    return NextResponse.json({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

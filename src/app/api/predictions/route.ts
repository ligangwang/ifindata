import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { createPrediction, listPredictions, PUBLIC_FEED_PREVIEW_LIMIT, validateCreatePredictionInput } from "@/lib/predictions/service";
import { type PredictionStatus } from "@/lib/predictions/types";
import { NextRequest, NextResponse } from "next/server";

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "20");
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.max(1, Math.min(50, Math.trunc(parsed)));
}

function isPredictionStatus(value: string | null): value is Exclude<PredictionStatus, "CANCELED"> | "ACTIVE" | "LIVE" | "FINAL" | "SETTLED" {
  return value === "ACTIVE" || value === "LIVE" || value === "FINAL" || value === "SETTLED" || value === "CREATED" || value === "OPEN" || value === "CLOSING";
}

function isPredictionSort(value: string | null): value is "createdAt" | "performance" {
  return value === "createdAt" || value === "performance";
}

export async function GET(request: NextRequest) {
  const statusParam = request.nextUrl.searchParams.get("status");
  const sortParam = request.nextUrl.searchParams.get("sort");
  const userId = request.nextUrl.searchParams.get("userId")?.trim() ?? "";
  const includePrivateParam = request.nextUrl.searchParams.get("includePrivate");
  const cursorCreatedAt = request.nextUrl.searchParams.get("cursorCreatedAt")?.trim() ?? "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  if (statusParam && !isPredictionStatus(statusParam)) {
    return NextResponse.json({ error: "status must be LIVE, SETTLED, ACTIVE, CREATED, OPEN, or CLOSING" }, { status: 400 });
  }

  if (sortParam && !isPredictionSort(sortParam)) {
    return NextResponse.json({ error: "sort must be createdAt or performance" }, { status: 400 });
  }

  const includePrivate = includePrivateParam === "true";
  const decoded = await getDecodedUserFromRequest(request);
  const isAnonymousPublicFeed = !decoded && !userId && !includePrivate;
  const effectiveLimit = isAnonymousPublicFeed ? Math.min(limit, PUBLIC_FEED_PREVIEW_LIMIT) : limit;
  let includePrivateForQuery = false;

  if (includePrivate) {
    includePrivateForQuery = Boolean(decoded && userId && decoded.uid === userId);
  }

  try {
    const result = await listPredictions({
      status: isPredictionStatus(statusParam) ? statusParam : undefined,
      userId: userId || undefined,
      includePrivate: includePrivateForQuery,
      cursorCreatedAt: isAnonymousPublicFeed ? undefined : cursorCreatedAt || undefined,
      limit: effectiveLimit,
      sort: isPredictionSort(sortParam) ? sortParam : undefined,
    });

    return NextResponse.json({
      items: result.items,
      nextCursor: isAnonymousPublicFeed ? null : result.nextCursor,
      viewerAccess: isAnonymousPublicFeed ? "preview" : "full",
      previewLimit: isAnonymousPublicFeed ? PUBLIC_FEED_PREVIEW_LIMIT : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const input = validateCreatePredictionInput(payload);
    const created = await createPrediction(input, {
      uid: decoded.uid,
      displayName: decoded.name,
      photoURL: decoded.picture,
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create prediction";
    const status = message.includes("Duplicate prediction")
      ? 409
      :
        message.includes("required") ||
        message.includes("must") ||
          message.includes("Invalid") ||
          message.includes("enabled") ||
          /part of pro|upgrade/i.test(message) ||
          message.includes("future") ||
          /limit reached|already exists in that watchlist/i.test(message)
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

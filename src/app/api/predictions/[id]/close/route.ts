import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { closePredictionWithReason } from "@/lib/predictions/service";
import { NextRequest, NextResponse } from "next/server";

function statusFromError(message: string): number {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (/forbidden/i.test(message)) {
    return 403;
  }

  if (/only open|must remain open|missing an entry|no eod price|invalid/i.test(message)) {
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

  const { id } = await context.params;

  try {
    const payload = (await request.json().catch(() => ({}))) as { reason?: unknown };
    const reason = typeof payload.reason === "string" ? payload.reason : "";
    const result = await closePredictionWithReason(id, reason, {
      uid: decoded.uid,
      displayName: decoded.name,
      photoURL: decoded.picture,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to close prediction";
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

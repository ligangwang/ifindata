import { type DecodedIdToken } from "firebase-admin/auth";
import { verifyIdToken } from "@/lib/firebase/admin";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";

function describeTokenForDebug(token: string | undefined) {
  if (!token) {
    return {
      present: false,
      length: 0,
      preview: null,
      sha256: null,
    };
  }

  return {
    present: true,
    length: token.length,
    preview: token.length > 12 ? `${token.slice(0, 6)}...${token.slice(-6)}` : token,
    sha256: createHash("sha256").update(token).digest("hex"),
  };
}

export async function getDecodedUserFromRequest(
  request: NextRequest,
): Promise<DecodedIdToken | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    return await verifyIdToken(token);
  } catch {
    return null;
  }
}

export function isInternalRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[internal-auth] Rejected internal request", {
      hasAuthorizationHeader: Boolean(authHeader),
      hasBearerPrefix: false,
      expectedToken: describeTokenForDebug(process.env.INTERNAL_API_TOKEN),
    });
    return false;
  }

  const provided = authHeader.slice(7);
  const expected = process.env.INTERNAL_API_TOKEN;
  const isAuthorized = Boolean(expected && provided === expected);

  if (!isAuthorized) {
    console.warn("[internal-auth] Rejected internal request", {
      hasAuthorizationHeader: true,
      hasBearerPrefix: true,
      providedToken: describeTokenForDebug(provided),
      expectedToken: describeTokenForDebug(expected),
    });
  }

  return isAuthorized;
}

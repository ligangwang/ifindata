import { type DecodedIdToken } from "firebase-admin/auth";
import { verifyIdToken } from "@/lib/firebase/admin";
import { NextRequest } from "next/server";

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
    return false;
  }

  const provided = authHeader.slice(7);
  const expected = process.env.INTERNAL_API_TOKEN;
  return Boolean(expected && provided === expected);
}
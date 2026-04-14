import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

function hasAdminClaim(decoded: Record<string, unknown>): boolean {
  return decoded.admin === true || decoded.role === "admin";
}

export async function GET(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  if (hasAdminClaim(decoded)) {
    return NextResponse.json({ isAdmin: true });
  }

  try {
    const userSnapshot = await getAdminFirestore().collection("users").doc(decoded.uid).get();
    return NextResponse.json({
      isAdmin: userSnapshot.exists && userSnapshot.data()?.role === "admin",
    });
  } catch (error) {
    console.error("Failed to resolve admin status:", error);
    return NextResponse.json({ error: "Failed to resolve admin status." }, { status: 500 });
  }
}

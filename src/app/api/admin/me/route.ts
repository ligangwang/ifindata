import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { resolveAdminRoleStatus } from "@/lib/firebase/admin-role";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  try {
    const adminStatus = await resolveAdminRoleStatus(decoded);

    return NextResponse.json({
      isAdmin: adminStatus.isAdmin,
      uid: decoded.uid,
      email: decoded.email ?? null,
      roleDebug: {
        claimRole: adminStatus.claimRole,
        claimAdmin: adminStatus.claimAdmin,
        claimIsAdmin: adminStatus.claimIsAdmin,
        firestoreRole: adminStatus.firestoreRole,
        firestoreRoles: adminStatus.firestoreRoles,
        firestoreAdmin: adminStatus.firestoreAdmin,
        firestoreIsAdmin: adminStatus.firestoreIsAdmin,
        firestoreUserExists: adminStatus.firestoreUserExists,
      },
    });
  } catch (error) {
    console.error("Failed to resolve admin status:", error);
    return NextResponse.json({ error: "Failed to resolve admin status." }, { status: 500 });
  }
}

import { getAdminFirestore } from "@/lib/firebase/admin";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { isAdminUser } from "@/lib/firebase/admin-role";
import { NextRequest, NextResponse } from "next/server";

async function collectionCount(collectionName: string): Promise<number> {
  const snapshot = await getAdminFirestore().collection(collectionName).count().get();
  return snapshot.data().count;
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

    const [users, predictions, feedback] = await Promise.all([
      collectionCount("users"),
      collectionCount("predictions"),
      collectionCount("feedback"),
    ]);

    return NextResponse.json({
      users,
      predictions,
      feedback,
    });
  } catch (error) {
    console.error("Failed to load admin stats:", error);
    return NextResponse.json({ error: "Failed to load admin stats." }, { status: 500 });
  }
}

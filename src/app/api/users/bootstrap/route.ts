import { getAdminFirestore, verifyIdToken } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type BootstrapRequest = {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
};

function resolveProvider(signInProvider?: string): "google" | "email" {
  return signInProvider === "google.com" ? "google" : "email";
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await verifyIdToken(token);
    const payload = (await request.json().catch(() => ({}))) as BootstrapRequest;
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(decoded.uid);
    const userSnapshot = await userRef.get();

    if (userSnapshot.exists) {
      return NextResponse.json({ created: false });
    }

    await userRef.set({
      displayName: payload.displayName ?? decoded.name ?? null,
      email: payload.email ?? decoded.email ?? null,
      photoURL: payload.photoURL ?? decoded.picture ?? null,
      authProviders: [resolveProvider(decoded.firebase.sign_in_provider)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bio: "",
      role: "user",
      stats: {
        totalPredictions: 0,
        openPredictions: 0,
        closedPredictions: 0,
        totalScore: 0,
      },
      settings: {
        isPublic: true,
      },
    });

    return NextResponse.json({ created: true });
  } catch (error) {
    console.error("Failed to bootstrap user profile:", error);
    return NextResponse.json({ error: "Failed to bootstrap user profile" }, { status: 500 });
  }
}

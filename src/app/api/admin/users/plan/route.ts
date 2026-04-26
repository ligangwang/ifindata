import { getAdminFirestore } from "@/lib/firebase/admin";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { isAdminUser } from "@/lib/firebase/admin-role";
import { canUseProFeaturesForUserData, getAppFeatures, readUserPlan, type UserPlan } from "@/lib/features";
import { NextRequest, NextResponse } from "next/server";

type UserRecord = {
  id: string;
  displayName: string | null;
  nickname: string | null;
  email: string | null;
  plan: UserPlan;
  canUsePro: boolean;
};

function normalizeIdentifier(raw: string | null): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.startsWith("@") ? value.slice(1) : value;
}

function normalizePlan(raw: unknown): UserPlan | null {
  return raw === "PRO" || raw === "FREE" ? raw : null;
}

function mapUserRecord(
  snapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): UserRecord {
  const data = snapshot.data() as Record<string, unknown> | undefined;
  return {
    id: snapshot.id,
    displayName: typeof data?.displayName === "string" ? data.displayName : null,
    nickname: typeof data?.nickname === "string" ? data.nickname : null,
    email: typeof data?.email === "string" ? data.email : null,
    plan: readUserPlan(data),
    canUsePro: canUseProFeaturesForUserData(data),
  };
}

async function findUserByIdentifier(identifier: string): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const db = getAdminFirestore();

  const byId = await db.collection("users").doc(identifier).get();
  if (byId.exists) {
    return byId;
  }

  const [byEmail, byNickname] = await Promise.all([
    db.collection("users").where("email", "==", identifier).limit(2).get(),
    db.collection("users").where("nickname", "==", identifier).limit(2).get(),
  ]);

  if (byEmail.size > 1) {
    throw new Error("Multiple users matched that email. Use the user id instead.");
  }

  if (!byEmail.empty) {
    return byEmail.docs[0];
  }

  if (byNickname.size > 1) {
    throw new Error("Multiple users matched that nickname. Use the user id or email instead.");
  }

  if (!byNickname.empty) {
    return byNickname.docs[0];
  }

  return null;
}

async function assertAdmin(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);
  if (!decoded) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!await isAdminUser(decoded)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin.ok) {
    return admin.response;
  }

  const identifier = normalizeIdentifier(request.nextUrl.searchParams.get("q"));
  if (!identifier) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const snapshot = await findUserByIdentifier(identifier);
    if (!snapshot?.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: mapUserRecord(snapshot),
      features: getAppFeatures(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user plan.";
    if (error instanceof Error) {
      console.error("Failed to load user plan:", error);
    }
    return NextResponse.json(
      { error: message },
      { status: /multiple users matched/i.test(message) ? 400 : 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin.ok) {
    return admin.response;
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const identifier = normalizeIdentifier(typeof body.identifier === "string" ? body.identifier : null);
  const plan = normalizePlan(body.plan);

  if (!identifier) {
    return NextResponse.json({ error: "identifier is required" }, { status: 400 });
  }

  if (!plan) {
    return NextResponse.json({ error: "plan must be FREE or PRO" }, { status: 400 });
  }

  try {
    const snapshot = await findUserByIdentifier(identifier);
    if (!snapshot?.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await snapshot.ref.set({
      billing: {
        plan,
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    const updatedSnapshot = await snapshot.ref.get();

    return NextResponse.json({
      updated: true,
      user: mapUserRecord(updatedSnapshot),
      features: getAppFeatures(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user plan.";
    if (error instanceof Error) {
      console.error("Failed to update user plan:", error);
    }
    return NextResponse.json(
      { error: message },
      { status: /multiple users matched/i.test(message) ? 400 : 500 },
    );
  }
}

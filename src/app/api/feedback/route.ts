import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

type FeedbackCategory = "FEATURE_REQUEST" | "BUG_REPORT" | "SUGGESTION";

type FeedbackRequest = {
  category?: unknown;
  subject?: unknown;
  message?: unknown;
  contactEmail?: unknown;
};

type FeedbackSubmission = {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  contactEmail: string | null;
  status: string;
  source: string | null;
  userId: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

const feedbackCategories = new Set<FeedbackCategory>(["FEATURE_REQUEST", "BUG_REPORT", "SUGGESTION"]);

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isFeedbackCategory(value: unknown): value is FeedbackCategory {
  return typeof value === "string" && feedbackCategories.has(value as FeedbackCategory);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasAdminClaim(decoded: Record<string, unknown>): boolean {
  return decoded.admin === true || decoded.role === "admin";
}

async function isAdminUser(request: NextRequest): Promise<boolean> {
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return false;
  }

  if (hasAdminClaim(decoded)) {
    return true;
  }

  const userSnapshot = await getAdminFirestore().collection("users").doc(decoded.uid).get();
  return userSnapshot.exists && userSnapshot.data()?.role === "admin";
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toFeedbackSubmission(snapshot: QueryDocumentSnapshot): FeedbackSubmission {
  const data = snapshot.data();
  const rawCategory = data.category;

  return {
    id: snapshot.id,
    category: isFeedbackCategory(rawCategory) ? rawCategory : "SUGGESTION",
    subject: readString(data.subject),
    message: readString(data.message),
    contactEmail: readNullableString(data.contactEmail),
    status: readString(data.status, "NEW"),
    source: readNullableString(data.source),
    userId: readNullableString(data.userId),
    userEmail: readNullableString(data.userEmail),
    userDisplayName: readNullableString(data.userDisplayName),
    userAgent: readNullableString(data.userAgent),
    createdAt: readString(data.createdAt),
    updatedAt: readString(data.updatedAt),
  };
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAdminUser(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await getAdminFirestore()
      .collection("feedback")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return NextResponse.json({
      submissions: snapshot.docs.map(toFeedbackSubmission),
    });
  } catch (error) {
    console.error("Failed to load feedback:", error);
    return NextResponse.json({ error: "Failed to load feedback." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as FeedbackRequest;
  const category = isFeedbackCategory(payload.category) ? payload.category : null;
  const subject = normalizeText(payload.subject, 120);
  const message = normalizeText(payload.message, 4000);
  const contactEmail = normalizeText(payload.contactEmail, 254);

  if (!category) {
    return NextResponse.json({ error: "Choose a feedback type." }, { status: 400 });
  }

  if (subject.length < 4) {
    return NextResponse.json({ error: "Subject must be at least 4 characters." }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json({ error: "Details must be at least 10 characters." }, { status: 400 });
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return NextResponse.json({ error: "Enter a valid contact email or leave it blank." }, { status: 400 });
  }

  try {
    const decoded = await getDecodedUserFromRequest(request);
    const now = new Date().toISOString();
    const db = getAdminFirestore();
    const feedbackRef = await db.collection("feedback").add({
      category,
      subject,
      message,
      contactEmail: contactEmail || decoded?.email || null,
      status: "NEW",
      source: "web",
      userId: decoded?.uid ?? null,
      userEmail: decoded?.email ?? null,
      userDisplayName: decoded?.name ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: feedbackRef.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json({ error: "Failed to submit feedback." }, { status: 500 });
  }
}

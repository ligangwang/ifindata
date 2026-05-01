import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { COMPANY_GRAPH_EXTRACTION_VERSION } from "@/lib/company-graph/types";

export type CompanyGraphRequestStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type CompanyGraphRequestDocument = {
  ticker: string;
  status: CompanyGraphRequestStatus;
  requestedCount: number;
  firstRequestedAt: string;
  lastRequestedAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  error: string | null;
  extractionVersion: typeof COMPANY_GRAPH_EXTRACTION_VERSION;
};

export type CompanyGraphRequestQueueResult = {
  ticker: string;
  status: "AVAILABLE" | "QUEUED" | "ALREADY_QUEUED";
  message: string;
};

export type CompanyGraphRequestListItem = CompanyGraphRequestDocument & {
  id: string;
};

function normalizeTicker(value: string): string {
  return value.trim().replace(/^\$/, "").toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function isValidTicker(value: string): boolean {
  return /^[A-Z0-9][A-Z0-9.-]{0,9}$/.test(value);
}

function readStatus(value: unknown): CompanyGraphRequestStatus {
  return value === "PROCESSING" || value === "COMPLETED" || value === "FAILED" ? value : "QUEUED";
}

function numberFromValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringFromValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function hasCurrentCompanyGraph(ticker: string): Promise<boolean> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return false;
  }

  const runSnapshot = await getAdminFirestore().collection("company_graph_runs").doc(`${normalizedTicker}_latest_10k`).get();
  const runData = runSnapshot.data() as Record<string, unknown> | undefined;

  return runData?.extractionVersion === COMPANY_GRAPH_EXTRACTION_VERSION &&
    typeof runData.edgeCount === "number" &&
    runData.edgeCount > 0;
}

export async function enqueueCompanyGraphRequest(rawTicker: string): Promise<CompanyGraphRequestQueueResult> {
  const ticker = normalizeTicker(rawTicker);
  if (!ticker || !isValidTicker(ticker)) {
    throw new Error("Enter a valid ticker.");
  }

  if (await hasCurrentCompanyGraph(ticker)) {
    return {
      ticker,
      status: "AVAILABLE",
      message: `${ticker} graph is ready.`,
    };
  }

  const db = getAdminFirestore();
  const requestRef = db.collection("company_graph_requests").doc(ticker);
  const nowIso = new Date().toISOString();

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(requestRef);
    const current = snapshot.data() as Record<string, unknown> | undefined;
    const currentStatus = readStatus(current?.status);
    const requestedCount = numberFromValue(current?.requestedCount);
    const isActive = currentStatus === "QUEUED" || currentStatus === "PROCESSING";

    transaction.set(requestRef, {
      ticker,
      status: isActive ? currentStatus : "QUEUED",
      requestedCount: requestedCount + 1,
      firstRequestedAt: stringFromValue(current?.firstRequestedAt) ?? nowIso,
      lastRequestedAt: nowIso,
      updatedAt: nowIso,
      completedAt: isActive ? stringFromValue(current?.completedAt) : null,
      failedAt: null,
      error: null,
      extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
    }, { merge: true });

    return {
      ticker,
      status: isActive ? "ALREADY_QUEUED" : "QUEUED",
      message: isActive
        ? `${ticker} is already in the graph request queue. Please check back in a few minutes.`
        : `${ticker} was added to the graph request queue.`,
    };
  });
}

export async function listCompanyGraphRequests(): Promise<CompanyGraphRequestListItem[]> {
  const snapshot = await getAdminFirestore().collection("company_graph_requests").limit(100).get();
  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const item: CompanyGraphRequestListItem = {
        id: doc.id,
        ticker: stringFromValue(data.ticker) ?? doc.id,
        status: readStatus(data.status),
        requestedCount: Math.max(1, numberFromValue(data.requestedCount)),
        firstRequestedAt: stringFromValue(data.firstRequestedAt) ?? "",
        lastRequestedAt: stringFromValue(data.lastRequestedAt) ?? "",
        updatedAt: stringFromValue(data.updatedAt) ?? "",
        completedAt: stringFromValue(data.completedAt),
        failedAt: stringFromValue(data.failedAt),
        error: stringFromValue(data.error),
        extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
      };
      return item;
    })
    .sort((left, right) => {
      const statusOrder: Record<CompanyGraphRequestStatus, number> = {
        PROCESSING: 0,
        QUEUED: 1,
        FAILED: 2,
        COMPLETED: 3,
      };
      const statusDelta = statusOrder[left.status] - statusOrder[right.status];
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return (right.lastRequestedAt || right.updatedAt).localeCompare(left.lastRequestedAt || left.updatedAt);
    });
}

export async function markCompanyGraphRequestProcessing(ticker: string): Promise<void> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return;
  }

  const nowIso = new Date().toISOString();
  await getAdminFirestore().collection("company_graph_requests").doc(normalizedTicker).set({
    ticker: normalizedTicker,
    status: "PROCESSING",
    updatedAt: nowIso,
    error: null,
    extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
  }, { merge: true });
}

export async function markCompanyGraphRequestCompleted(ticker: string, edgeCount: number): Promise<void> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return;
  }

  const nowIso = new Date().toISOString();
  await getAdminFirestore().collection("company_graph_requests").doc(normalizedTicker).set({
    ticker: normalizedTicker,
    status: "COMPLETED",
    edgeCount,
    completedAt: nowIso,
    updatedAt: nowIso,
    error: null,
    extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
  }, { merge: true });
}

export async function markCompanyGraphRequestFailed(ticker: string, error: string): Promise<void> {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) {
    return;
  }

  const nowIso = new Date().toISOString();
  await getAdminFirestore().collection("company_graph_requests").doc(normalizedTicker).set({
    ticker: normalizedTicker,
    status: "FAILED",
    failedAt: nowIso,
    updatedAt: nowIso,
    error,
    extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
    failureCount: FieldValue.increment(1),
  }, { merge: true });
}

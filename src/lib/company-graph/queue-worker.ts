import { randomUUID } from "node:crypto";
import {
  claimCompanyGraphRequest,
  listQueuedCompanyGraphRequests,
  markCompanyGraphRequestCompleted,
  markCompanyGraphRequestFailed,
} from "@/lib/company-graph/requests";
import { runLatest10KCompanyGraphExtraction } from "@/lib/company-graph/service";

export type CompanyGraphQueueProcessedItem = {
  ticker: string;
  status: "COMPLETED" | "FAILED" | "SKIPPED";
  edgeCount: number | null;
  cached: boolean | null;
  error: string | null;
  runId: string | null;
  estimatedCostUsd: number | null;
};

export type CompanyGraphQueueWorkerResult = {
  processingRunId: string;
  requestedLimit: number;
  claimedCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  items: CompanyGraphQueueProcessedItem[];
};

function queueBatchSizeFromEnv(): number {
  const parsed = Number(process.env.COMPANY_GRAPH_QUEUE_BATCH_SIZE ?? "1");
  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.min(5, Math.trunc(parsed)));
}

export function normalizeCompanyGraphQueueLimit(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? queueBatchSizeFromEnv());
  if (!Number.isFinite(parsed)) {
    return queueBatchSizeFromEnv();
  }

  return Math.max(1, Math.min(5, Math.trunc(parsed)));
}

export async function processQueuedCompanyGraphRequests(input: {
  limit?: number;
  force?: boolean;
} = {}): Promise<CompanyGraphQueueWorkerResult> {
  const requestedLimit = normalizeCompanyGraphQueueLimit(input.limit);
  const processingRunId = `company_graph_queue_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const candidates = await listQueuedCompanyGraphRequests(requestedLimit * 3);
  const items: CompanyGraphQueueProcessedItem[] = [];
  let claimedCount = 0;

  for (const candidate of candidates) {
    if (claimedCount >= requestedLimit) {
      break;
    }

    const claimed = await claimCompanyGraphRequest(candidate.ticker, processingRunId);
    if (!claimed) {
      items.push({
        ticker: candidate.ticker,
        status: "SKIPPED",
        edgeCount: null,
        cached: null,
        error: "Request was already claimed or no longer queued.",
        runId: null,
        estimatedCostUsd: null,
      });
      continue;
    }

    claimedCount += 1;

    try {
      const result = await runLatest10KCompanyGraphExtraction({
        ticker: claimed.ticker,
        dryRun: false,
        force: input.force === true,
      });
      await markCompanyGraphRequestCompleted(result.ticker, result.edges.length);

      items.push({
        ticker: result.ticker,
        status: "COMPLETED",
        edgeCount: result.edges.length,
        cached: result.cached,
        error: null,
        runId: result.runId,
        estimatedCostUsd: result.extraction?.usageEvent?.estimatedCostUsd ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to extract company graph";
      await markCompanyGraphRequestFailed(claimed.ticker, message);
      items.push({
        ticker: claimed.ticker,
        status: "FAILED",
        edgeCount: null,
        cached: null,
        error: message,
        runId: null,
        estimatedCostUsd: null,
      });
    }
  }

  return {
    processingRunId,
    requestedLimit,
    claimedCount,
    completedCount: items.filter((item) => item.status === "COMPLETED").length,
    failedCount: items.filter((item) => item.status === "FAILED").length,
    skippedCount: items.filter((item) => item.status === "SKIPPED").length,
    items,
  };
}

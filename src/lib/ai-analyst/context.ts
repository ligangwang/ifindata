import { getAdminFirestore } from "@/lib/firebase/admin";
import { getAiAnalystConfig, type AiAnalystId } from "@/lib/ai-analyst/config";
import { getAiAnalystUserId } from "@/lib/ai-analyst/runtime";

const ACTIVE_PREDICTION_STATUSES = ["CREATED", "OPEN", "CLOSING"] as const;

export type AiAnalystOpenCallSummary = {
  predictionId: string;
  ticker: string;
  direction: "UP" | "DOWN";
  thesisTitle: string;
  confidence: number | null;
  catalyst: string | null;
  createdAt: string;
  entryDate: string | null;
  markReturnValue: number | null;
  targetDate: string | null;
  status: (typeof ACTIVE_PREDICTION_STATUSES)[number];
};

export type AiAnalystDailyContext = {
  configId: AiAnalystId;
  analystUserId: string;
  universeTickers: string[];
  openCalls: AiAnalystOpenCallSummary[];
  openTickers: string[];
  eligibleTickers: string[];
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function buildAiAnalystDailyContext(
  configId: AiAnalystId,
  analystUserId = getAiAnalystUserId(),
): Promise<AiAnalystDailyContext> {
  const db = getAdminFirestore();
  const config = getAiAnalystConfig(configId);
  const snapshot = await db
    .collection("predictions")
    .where("userId", "==", analystUserId)
    .where("status", "in", [...ACTIVE_PREDICTION_STATUSES])
    .orderBy("createdAt", "desc")
    .get();

  const openCalls = snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const ticker = stringOrNull(data.ticker);
      const direction = data.direction === "DOWN" ? "DOWN" : data.direction === "UP" ? "UP" : null;
      const status = ACTIVE_PREDICTION_STATUSES.find((candidate) => candidate === data.status);

      if (!ticker || !direction || !status) {
        return null;
      }

      return {
        predictionId: doc.id,
        ticker,
        direction,
        thesisTitle: stringOrNull(data.thesisTitle) ?? "Untitled thesis",
        confidence: numberOrNull((data.generation as Record<string, unknown> | undefined)?.confidence),
        catalyst: stringOrNull((data.generation as Record<string, unknown> | undefined)?.catalyst),
        createdAt: stringOrNull(data.createdAt) ?? "",
        entryDate: stringOrNull(data.entryDate),
        markReturnValue: numberOrNull(data.markReturnValue),
        targetDate: stringOrNull((data.timeHorizon as Record<string, unknown> | undefined)?.targetDate),
        status,
      } satisfies AiAnalystOpenCallSummary;
    })
    .filter((item): item is AiAnalystOpenCallSummary => item !== null);

  const openTickers = Array.from(new Set(openCalls.map((item) => item.ticker)));

  return {
    configId,
    analystUserId,
    universeTickers: [...config.coverage.tickers],
    openCalls,
    openTickers,
    eligibleTickers: config.coverage.tickers.filter((ticker) => !openTickers.includes(ticker)),
  };
}

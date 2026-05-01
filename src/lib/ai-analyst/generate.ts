import { getAdminFirestore } from "@/lib/firebase/admin";
import { buildAiAnalystDailyContext } from "@/lib/ai-analyst/context";
import { aiChipsAnalystConfig } from "@/lib/ai-analyst/config";
import { getAiAnalystUserId, getOpenAiApiKey, getOpenAiModel } from "@/lib/ai-analyst/runtime";
import { generateAiAnalystCalls } from "@/lib/ai-analyst/openai";
import { safeRecordOpenAiUsageEvent } from "@/lib/openai/usage";

export type AiAnalystGenerateInput = {
  runDate?: string;
  dryRun?: boolean;
  force?: boolean;
};

export type AiAnalystGenerateResult = {
  dryRun: boolean;
  force: boolean;
  runDate: string;
  analystUserId: string;
  eodRun: {
    status: string | null;
    completedAt: string | null;
  };
  generation: {
    provider: "openai";
    model: string;
    promptVersion: string;
    allowNoCall: boolean;
    maxNewCallsPerRun: number;
    responseId: string | null;
  };
  context: {
    universeTickers: string[];
    openTickers: string[];
    eligibleTickers: string[];
    openCalls: ReturnType<typeof summarizeOpenCalls>;
  };
  drafts: Array<{
    id: string;
    ticker: string;
    action: "NO_CALL" | "CREATE_CALL";
    status: "DRAFT" | "SKIPPED";
    direction: "UP" | "DOWN" | null;
    confidence: number | null;
    catalyst: string | null;
  }>;
  promptPayload: {
    analyst: {
      id: string;
      displayName: string;
      badgeLabel: string;
      theme: string;
    };
    portfolio: {
      currentOpenPredictions: ReturnType<typeof summarizeOpenCalls>;
      maxOpenPredictions: number;
      oneOpenPredictionPerTicker: boolean;
    };
    rules: {
      requiresAdminReview: boolean;
      mayPublishZeroCalls: boolean;
      minPublishConfidence: number;
      maxNewCallsPerRun: number;
    };
    candidateUniverse: {
      market: string;
      currentFocusTickers: string[];
      thesisScope: string[];
      usListedOnly: boolean;
      minMarketCapUsd: number;
    };
    eligibleTickers: string[];
    runDate: string;
  };
};

function getCurrentEasternDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function eodRunDocId(runDate: string, market = "US"): string {
  return [market, runDate].join("_");
}

function summarizeOpenCalls(openCalls: Awaited<ReturnType<typeof buildAiAnalystDailyContext>>["openCalls"]) {
  return openCalls.map((item) => ({
    predictionId: item.predictionId,
    ticker: item.ticker,
    direction: item.direction,
    thesisTitle: item.thesisTitle,
    confidence: item.confidence,
    catalyst: item.catalyst,
    createdAt: item.createdAt,
    entryDate: item.entryDate,
    markReturnValue: item.markReturnValue,
    targetDate: item.targetDate,
    status: item.status,
  }));
}

export async function runAiAnalystGenerate(
  input: AiAnalystGenerateInput = {},
): Promise<AiAnalystGenerateResult> {
  getOpenAiApiKey();

  const db = getAdminFirestore();
  const runDate = input.runDate?.trim() || getCurrentEasternDate();
  const dryRun = input.dryRun !== false;
  const force = input.force === true;
  const analystUserId = getAiAnalystUserId();

  const eodSnapshot = await db.collection("eod_runs").doc(eodRunDocId(runDate)).get();
  const eodData = eodSnapshot.data() as Record<string, unknown> | undefined;
  const eodStatus = typeof eodData?.status === "string" ? eodData.status : null;
  const eodCompletedAt = typeof eodData?.completedAt === "string" ? eodData.completedAt : null;

  if (!force && eodStatus !== "COMPLETED") {
    throw new Error(`EOD run for ${runDate} is not completed. Current status: ${eodStatus ?? "missing"}.`);
  }

  const dailyContext = await buildAiAnalystDailyContext(aiChipsAnalystConfig.id, analystUserId);
  const openCalls = summarizeOpenCalls(dailyContext.openCalls);
  const promptPayload = {
    analyst: {
      id: aiChipsAnalystConfig.id,
      displayName: aiChipsAnalystConfig.identity.displayName,
      badgeLabel: aiChipsAnalystConfig.identity.badgeLabel,
      theme: aiChipsAnalystConfig.identity.theme,
    },
    portfolio: {
      currentOpenPredictions: openCalls,
      maxOpenPredictions: aiChipsAnalystConfig.publication.portfolio.maxOpenPredictions,
      oneOpenPredictionPerTicker: aiChipsAnalystConfig.guardrails.openCallPolicy.blockDuplicateTickerWhileOpen,
    },
    rules: {
      requiresAdminReview: aiChipsAnalystConfig.guardrails.approval.requiresAdminReview,
      mayPublishZeroCalls: aiChipsAnalystConfig.publication.cadence.mayPublishZeroCalls,
      minPublishConfidence: aiChipsAnalystConfig.guardrails.confidence.minPublishConfidence,
      maxNewCallsPerRun: aiChipsAnalystConfig.publication.cadence.maxNewCallsPerRun,
    },
    candidateUniverse: {
      market: aiChipsAnalystConfig.coverage.market,
      currentFocusTickers: aiChipsAnalystConfig.coverage.tickers,
      thesisScope: aiChipsAnalystConfig.coverage.thesisScope,
      usListedOnly: aiChipsAnalystConfig.coverage.candidateRequirements.usListedOnly,
      minMarketCapUsd: aiChipsAnalystConfig.coverage.candidateRequirements.minMarketCapUsd,
    },
    eligibleTickers: dailyContext.eligibleTickers,
    runDate,
  };
  const openAiResult = await generateAiAnalystCalls(promptPayload);
  const nowIso = new Date().toISOString();
  await safeRecordOpenAiUsageEvent({
    purpose: "ai_analyst_generation",
    model: openAiResult.model,
    responseId: openAiResult.responseId,
    usage: openAiResult.usage,
    createdAt: nowIso,
    metadata: {
      aiAnalystId: aiChipsAnalystConfig.id,
      analystUserId,
      runDate,
      dryRun,
      force,
      eligibleTickerCount: dailyContext.eligibleTickers.length,
      decisionCount: openAiResult.decisions.length,
    },
  });
  const drafts: AiAnalystGenerateResult["drafts"] = [];

  for (const decision of openAiResult.decisions) {
    const isCreateCall = decision.action === "CREATE_CALL";
    const confidence =
      typeof decision.confidence === "number" &&
      decision.confidence >= aiChipsAnalystConfig.guardrails.confidence.minPublishConfidence
        ? decision.confidence
        : null;
    const eligibleTicker = dailyContext.eligibleTickers.includes(decision.ticker);
    const shouldPersistDraft =
      isCreateCall &&
      eligibleTicker &&
      !!decision.direction &&
      !!decision.thesisTitle &&
      !!decision.thesis &&
      !!decision.timeHorizon &&
      confidence !== null;

    const draftRef = db.collection("ai_prediction_drafts").doc();
    drafts.push({
      id: draftRef.id,
      ticker: decision.ticker,
      action: decision.action,
      status: shouldPersistDraft ? "DRAFT" : "SKIPPED",
      direction: decision.direction,
      confidence,
      catalyst: decision.catalyst,
    });

    if (dryRun) {
      continue;
    }

    await draftRef.set({
      analystUserId,
      aiAnalystId: aiChipsAnalystConfig.id,
      runDate,
      createdAt: nowIso,
      updatedAt: nowIso,
      status: shouldPersistDraft ? "DRAFT" : "SKIPPED",
      action: decision.action,
      ticker: decision.ticker,
      direction: decision.direction,
      confidence,
      catalyst: decision.catalyst,
      thesisTitle: decision.thesisTitle,
      thesis: decision.thesis,
      signals: decision.signals,
      risks: decision.risks,
      rationale: decision.rationale,
      timeHorizon: decision.timeHorizon,
      generation: {
        provider: aiChipsAnalystConfig.generation.provider,
        model: openAiResult.model,
        promptVersion: aiChipsAnalystConfig.generation.promptVersion,
        responseId: openAiResult.responseId,
        rawOutputText: openAiResult.outputText,
        usage: openAiResult.usage,
      },
      promptPayload,
      validation: {
        eligibleTicker,
        meetsConfidenceThreshold: confidence !== null,
        hasRequiredFields:
          !!decision.direction && !!decision.thesisTitle && !!decision.thesis && !!decision.timeHorizon,
      },
    });
  }

  return {
    dryRun,
    force,
    runDate,
    analystUserId,
    eodRun: {
      status: eodStatus,
      completedAt: eodCompletedAt,
    },
    generation: {
      provider: aiChipsAnalystConfig.generation.provider,
      model: getOpenAiModel(),
      promptVersion: aiChipsAnalystConfig.generation.promptVersion,
      allowNoCall: aiChipsAnalystConfig.generation.allowNoCall,
      maxNewCallsPerRun: aiChipsAnalystConfig.publication.cadence.maxNewCallsPerRun,
      responseId: openAiResult.responseId,
    },
    context: {
      universeTickers: dailyContext.universeTickers,
      openTickers: dailyContext.openTickers,
      eligibleTickers: dailyContext.eligibleTickers,
      openCalls,
    },
    drafts,
    promptPayload,
  };
}

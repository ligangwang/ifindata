export const PREDICTION_DIRECTIONS = ["UP", "DOWN"] as const;
export const PREDICTION_STATUSES = ["OPENING", "OPEN", "CLOSING", "CLOSED", "CANCELED"] as const;
export const PREDICTION_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
export const PREDICTION_TIME_HORIZON_UNITS = ["DAYS", "MONTHS", "YEARS"] as const;
export const MAX_PREDICTION_THESIS_TITLE_LENGTH = 120;
export const MAX_PREDICTION_THESIS_LENGTH = 10000;

export type PredictionDirection = (typeof PREDICTION_DIRECTIONS)[number];
export type PredictionStatus = (typeof PREDICTION_STATUSES)[number];
export type PredictionVisibility = (typeof PREDICTION_VISIBILITIES)[number];
export type PredictionTimeHorizonUnit = (typeof PREDICTION_TIME_HORIZON_UNITS)[number];

export type PredictionTimeHorizon = {
  value: number;
  unit: PredictionTimeHorizonUnit;
  targetDate: string;
};

export type UserStats = {
  totalPredictions: number;
  totalCalls?: number;
  openingPredictions: number;
  openPredictions: number;
  closingPredictions: number;
  closedPredictions: number;
  canceledPredictions: number;
  totalScore: number;
  settledCalls?: number;
  totalXP?: number;
  level?: number;
  avgPredictionScore?: number;
  consistency?: number;
  coverage?: number;
  avgReturn?: number;
  winRate?: number;
  eligibleForLeaderboard?: boolean;
};

export type UserProfile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  authProviders: string[];
  createdAt: string;
  updatedAt: string;
  bio: string;
  nickname: string | null;
  interests: string[];
  stats: UserStats;
  settings: {
    isPublic: boolean;
  };
};

export type PredictionResult = {
  exitPrice: number;
  exitPriceSource: string;
  returnValue: number;
  score: number;
  predictionScore?: number;
  outcome?: number;
  xpEarned?: number;
};

export type Prediction = {
  userId: string;
  authorDisplayName: string | null;
  authorPhotoURL: string | null;
  ticker: string;
  direction: PredictionDirection;
  thesisTitle?: string;
  entryRequestedAt: string;
  entryTargetDate: string;
  entryPrice: number | null;
  entryPriceSource: string | null;
  entryDate: string | null;
  entryTime: string | null;
  entryCapturedAt: string | null;
  thesis: string;
  timeHorizon?: PredictionTimeHorizon | null;
  status: PredictionStatus;
  visibility: PredictionVisibility;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  markPrice?: number | null;
  markPriceSource?: string | null;
  markPriceDate?: string | null;
  markPriceCapturedAt?: string | null;
  markReturnValue?: number | null;
  markScore?: number | null;
  markPredictionScore?: number | null;
  scoreAppliedToUser?: number | null;
  predictionScore?: number | null;
  xpEarned?: number | null;
  outcome?: number | null;
  closeRequestedAt?: string | null;
  closeTargetDate?: string | null;
  closedAt: string | null;
  canceledAt?: string | null;
  result: PredictionResult | null;
};

export type PredictionComment = {
  predictionId: string;
  userId: string;
  authorDisplayName: string | null;
  authorPhotoURL: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type CreatePredictionInput = {
  ticker: string;
  direction: PredictionDirection;
  thesisTitle: string;
  thesis: string;
  timeHorizon?: PredictionTimeHorizon | null;
  visibility?: PredictionVisibility;
};

export type UpdatePredictionInput = {
  thesisTitle: string;
  thesis: string;
  timeHorizon?: PredictionTimeHorizon | null;
};

export function isPredictionDirection(value: unknown): value is PredictionDirection {
  return typeof value === "string" && (PREDICTION_DIRECTIONS as readonly string[]).includes(value);
}

export function isPredictionVisibility(value: unknown): value is PredictionVisibility {
  return (
    typeof value === "string" && (PREDICTION_VISIBILITIES as readonly string[]).includes(value)
  );
}

export function isPredictionTimeHorizonUnit(value: unknown): value is PredictionTimeHorizonUnit {
  return typeof value === "string" && (PREDICTION_TIME_HORIZON_UNITS as readonly string[]).includes(value);
}

export function normalizeTicker(raw: string): string {
  return raw.trim().toUpperCase();
}

export function sanitizePredictionThesis(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("Market data provider not configured.")) {
    return "";
  }

  return trimmed;
}

export function sanitizePredictionThesisTitle(raw: string | null | undefined): string {
  return raw?.trim() ?? "";
}

export function splitIsoDateTime(isoTimestamp: string): { entryDate: string; entryTime: string } {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp for entry date/time");
  }

  const [entryDate, timeWithMs] = date.toISOString().split("T");
  const entryTime = (timeWithMs ?? "00:00:00.000Z").slice(0, 8);

  return { entryDate, entryTime };
}

export function computeReturnValue(
  direction: PredictionDirection,
  entryPrice: number,
  exitPrice: number,
): number {
  if (direction === "UP") {
    return (exitPrice - entryPrice) / entryPrice;
  }
  return (entryPrice - exitPrice) / entryPrice;
}

export function computeScoreFromReturn(returnValue: number): number {
  return Math.round(1000 * Math.tanh(returnValue / 0.30));
}

export function computeDisplayPercent(returnValue: number): number {
  return returnValue * 100;
}

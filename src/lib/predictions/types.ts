export const PREDICTION_DIRECTIONS = ["UP", "DOWN"] as const;
export const PREDICTION_STATUSES = ["ACTIVE", "SETTLED"] as const;
export const PREDICTION_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;

export type PredictionDirection = (typeof PREDICTION_DIRECTIONS)[number];
export type PredictionStatus = (typeof PREDICTION_STATUSES)[number];
export type PredictionVisibility = (typeof PREDICTION_VISIBILITIES)[number];

export type UserStats = {
  totalPredictions: number;
  activePredictions: number;
  settledPredictions: number;
  totalScore: number;
};

export type UserProfile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  authProviders: string[];
  createdAt: string;
  updatedAt: string;
  bio: string;
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
  displayPercent: number;
};

export type Prediction = {
  userId: string;
  authorDisplayName: string | null;
  authorPhotoURL: string | null;
  ticker: string;
  direction: PredictionDirection;
  entryPrice: number;
  entryPriceSource: string;
  entryCapturedAt: string;
  expiryAt: string;
  thesis: string;
  status: PredictionStatus;
  visibility: PredictionVisibility;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
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
  expiryAt: string;
  thesis?: string;
  visibility?: PredictionVisibility;
};

export function isPredictionDirection(value: unknown): value is PredictionDirection {
  return typeof value === "string" && (PREDICTION_DIRECTIONS as readonly string[]).includes(value);
}

export function isPredictionVisibility(value: unknown): value is PredictionVisibility {
  return (
    typeof value === "string" && (PREDICTION_VISIBILITIES as readonly string[]).includes(value)
  );
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
  return Math.round(returnValue * 10000);
}

export function computeDisplayPercent(score: number): number {
  return score / 100;
}
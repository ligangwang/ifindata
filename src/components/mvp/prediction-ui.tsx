import type { PredictionDirection } from "@/lib/predictions/types";

export type PredictionMarkFields = {
  direction: PredictionDirection;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markDisplayPercent?: number | null;
  commentCount?: number | null;
};

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatScorePercent(score: number): string {
  return formatSignedPercent(score / 100);
}

export function formatMarkPercent(markDisplayPercent: number): string {
  return formatSignedPercent(markDisplayPercent);
}

export function markToneClass(value: number): string {
  if (value > 0) {
    return "text-emerald-300";
  }
  if (value < 0) {
    return "text-rose-300";
  }
  return "text-slate-300";
}

export function DirectionBadge({ direction }: { direction: PredictionDirection }) {
  const isUp = direction === "UP";

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
      <span aria-hidden="true">{isUp ? "\u2191" : "\u2193"}</span>
      {direction}
    </span>
  );
}

export function PredictionMarkSummary({ prediction }: { prediction: PredictionMarkFields }) {
  const markPrice = prediction.markPrice;
  const markPriceDate = prediction.markPriceDate;
  const markDisplayPercent = prediction.markDisplayPercent;
  const hasMarkData =
    typeof markPrice === "number" &&
    typeof markDisplayPercent === "number" &&
    typeof markPriceDate === "string" &&
    markPriceDate.length > 0;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
      {hasMarkData ? (
        <>
          <span>
            Mark {markPrice.toFixed(2)} on {markPriceDate}
          </span>
          <span className={markToneClass(markDisplayPercent)}>
            {formatMarkPercent(markDisplayPercent)}
          </span>
        </>
      ) : null}
      <span>{prediction.commentCount ?? 0} comments</span>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import type { PredictionDirection, PredictionStatus } from "@/lib/predictions/types";

export type PredictionMarkFields = {
  direction: PredictionDirection;
  entryPrice?: number | null;
  entryDate?: string | null;
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

export function formatAbsoluteDateTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString();
}

function wholeCalendarMonthsBetween(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth();
  const anniversary = new Date(start);
  anniversary.setMonth(start.getMonth() + months);
  return anniversary > end ? months - 1 : months;
}

function wholeCalendarYearsBetween(start: Date, end: Date): number {
  const years = end.getFullYear() - start.getFullYear();
  const anniversary = new Date(start);
  anniversary.setFullYear(start.getFullYear() + years);
  return anniversary > end ? years - 1 : years;
}

export function formatRelativeDateTime(value: string, now = Date.now()): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  const date = new Date(timestamp);
  const nowDate = new Date(now);
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) {
    return `${Math.max(1, elapsedSeconds)}s`;
  }
  if (elapsedSeconds < 60 * 60) {
    return `${Math.floor(elapsedSeconds / 60)}m`;
  }
  if (elapsedSeconds < 24 * 60 * 60) {
    return `${Math.floor(elapsedSeconds / (60 * 60))}h`;
  }
  if (elapsedSeconds < 30 * 24 * 60 * 60) {
    return `${Math.floor(elapsedSeconds / (24 * 60 * 60))}d`;
  }

  const months = wholeCalendarMonthsBetween(date, nowDate);
  if (months < 12) {
    return `${Math.max(1, months)}M`;
  }
  return `${Math.max(1, wholeCalendarYearsBetween(date, nowDate))}y`;
}

function relativeTimeRefreshDelay(value: string, now = Date.now()): number {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return 60 * 1000;
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) {
    return 1000;
  }
  if (elapsedSeconds < 60 * 60) {
    return (60 - (elapsedSeconds % 60)) * 1000;
  }
  if (elapsedSeconds < 24 * 60 * 60) {
    return (60 * 60 - (elapsedSeconds % (60 * 60))) * 1000;
  }
  return (24 * 60 * 60 - (elapsedSeconds % (24 * 60 * 60))) * 1000;
}

export function RelativeTime({ value, prefix }: { value: string; prefix?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setNow(Date.now());
    }, relativeTimeRefreshDelay(value, now));

    return () => window.clearTimeout(timeout);
  }, [value, now]);

  return (
    <time dateTime={value} title={formatAbsoluteDateTime(value)} suppressHydrationWarning>
      {prefix ? `${prefix} ` : ""}
      {formatRelativeDateTime(value, now)}
    </time>
  );
}

export function PredictionThesisText({
  text,
  fallback = "No thesis provided.",
  className = "",
}: {
  text: string;
  fallback?: string;
  className?: string;
}) {
  const content = text.trim() || fallback;

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {content}
    </span>
  );
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

export function formatPredictionStatus(status: PredictionStatus): string {
  switch (status) {
    case "OPENING":
      return "Opening";
    case "OPEN":
      return "Open";
    case "CLOSING":
      return "Closing";
    case "CLOSED":
      return "Closed";
    case "CANCELED":
      return "Canceled";
  }
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
  const entryPrice = prediction.entryPrice;
  const entryDate = prediction.entryDate;
  const markPrice = prediction.markPrice;
  const markPriceDate = prediction.markPriceDate;
  const markDisplayPercent = prediction.markDisplayPercent;
  const hasEntryData =
    typeof entryPrice === "number" &&
    typeof entryDate === "string" &&
    entryDate.length > 0;
  const hasMarkData =
    typeof markPrice === "number" &&
    typeof markDisplayPercent === "number" &&
    typeof markPriceDate === "string" &&
    markPriceDate.length > 0;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
      {hasEntryData ? <span>Entry {entryPrice.toFixed(2)} @ {entryDate}</span> : null}
      {hasMarkData ? (
        <>
          <span>
            Mark {markPrice.toFixed(2)} @ {markPriceDate}
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


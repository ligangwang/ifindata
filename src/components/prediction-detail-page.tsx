"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { formatPredictionStatus, formatPredictionThesisTitle, formatReturnPercent, formatTickerSymbol, markToneClass, PredictionAuthorSummary, PredictionThesisText, RelativeTime } from "@/components/prediction-ui";
import {
  MAX_PREDICTION_THESIS_LENGTH,
  MAX_PREDICTION_THESIS_TITLE_LENGTH,
  sanitizePredictionThesis,
  type PredictionStatus,
  type PredictionTimeHorizon,
  type PredictionTimeHorizonUnit,
} from "@/lib/predictions/types";

type PredictionDetail = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  authorPhotoURL?: string | null;
  authorStats?: {
    totalScore?: number | null;
    totalPredictions?: number | null;
  } | null;
  ticker: string;
  direction: "UP" | "DOWN";
  entryPrice: number | null;
  entryDate: string | null;
  thesisTitle: string;
  thesis: string;
  timeHorizon: PredictionTimeHorizon | null;
  status: PredictionStatus;
  createdAt: string;
  closeRequestedAt?: string | null;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markReturnValue?: number | null;
  commentCount: number;
  result: {
    score: number;
    exitPrice: number;
    returnValue: number;
  } | null;
};

type PredictionComment = {
  id: string;
  predictionId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  content: string;
  createdAt: string;
};

const DETAIL_CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const DETAIL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDetailCurrency(value: number | null | undefined): string {
  return typeof value === "number" ? DETAIL_CURRENCY_FORMATTER.format(value) : "Pending";
}

function formatDetailDate(value: string | null | undefined): string {
  if (!value) {
    return "Pending";
  }

  const [dateOnly] = value.split("T");
  const parts = dateOnly.split("-").map(Number);
  const date =
    parts.length === 3 && parts.every(Number.isFinite)
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return DETAIL_DATE_FORMATTER.format(date);
}

function formatDetailStatus(status: PredictionStatus): string {
  return status === "CLOSING" ? "Close pending" : formatPredictionStatus(status);
}

function formatResultReturn(result: NonNullable<PredictionDetail["result"]>): string {
  return formatReturnPercent(result.returnValue);
}

export function PredictionDetailPage({ predictionId }: { predictionId: string }) {
  const { getIdToken, user } = useAuth();
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [comments, setComments] = useState<PredictionComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<"close" | "cancel" | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editThesis, setEditThesis] = useState("");
  const [editHorizonUnit, setEditHorizonUnit] = useState<"NONE" | PredictionTimeHorizonUnit>("NONE");
  const [editHorizonValue, setEditHorizonValue] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const headers = token ? { authorization: `Bearer ${token}` } : undefined;
      const [predictionResponse, commentResponse] = await Promise.all([
        fetch(`/api/predictions/${predictionId}`, { headers }),
        fetch(`/api/predictions/${predictionId}/comments?limit=100`, { headers }),
      ]);

      if (!predictionResponse.ok) {
        throw new Error("Prediction not found.");
      }

      const predictionPayload = (await predictionResponse.json()) as PredictionDetail;
      const commentPayload = commentResponse.ok
        ? ((await commentResponse.json()) as { items: PredictionComment[] })
        : { items: [] };

      setPrediction(predictionPayload);
      setComments(commentPayload.items);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load prediction.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function submitComment() {
    if (!commentText.trim()) {
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setError("Sign in to add comments.");
      return;
    }

    const response = await fetch(`/api/predictions/${predictionId}/comments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: commentText.trim() }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Unable to add comment.");
      return;
    }

    setCommentText("");
    await loadAll();
  }

  async function runPredictionAction(action: "close" | "cancel") {
    const token = await getIdToken();
    if (!token) {
      setError("Sign in to manage this prediction.");
      return;
    }

    setActionPending(action);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/${predictionId}/${action}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to update prediction.");
      }

      await loadAll();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update prediction.");
    } finally {
      setActionPending(null);
    }
  }

  function startEditing() {
    if (!prediction) {
      return;
    }

    setEditTitle(prediction.thesisTitle ?? "");
    setEditThesis(prediction.thesis ?? "");
    setEditHorizonUnit(prediction.timeHorizon?.unit ?? "NONE");
    setEditHorizonValue(prediction.timeHorizon ? String(prediction.timeHorizon.value) : "");
    setEditing(true);
    setError(null);
  }

  async function saveEdits() {
    if (!prediction) {
      return;
    }

    const trimmedTitle = editTitle.trim();
    const trimmedThesis = editThesis.trim();
    const horizonValue = Number(editHorizonValue);
    const validHorizon =
      editHorizonUnit === "NONE" ||
      (Number.isInteger(horizonValue) && horizonValue > 0);

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (trimmedTitle.length > MAX_PREDICTION_THESIS_TITLE_LENGTH) {
      setError(`Title must be ${MAX_PREDICTION_THESIS_TITLE_LENGTH} characters or fewer.`);
      return;
    }
    if (trimmedThesis.length > MAX_PREDICTION_THESIS_LENGTH) {
      setError(`Thesis must be ${MAX_PREDICTION_THESIS_LENGTH} characters or fewer.`);
      return;
    }
    if (!validHorizon) {
      setError("Open until must be a positive whole number.");
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setError("Sign in to edit this prediction.");
      return;
    }

    setEditSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/predictions/${predictionId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          thesisTitle: trimmedTitle,
          thesis: trimmedThesis,
          timeHorizon: editHorizonUnit === "NONE"
            ? null
            : {
                value: horizonValue,
                unit: editHorizonUnit,
              },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to edit prediction.");
      }

      setEditing(false);
      await loadAll();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to edit prediction.");
    } finally {
      setEditSaving(false);
    }
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-slate-300">Loading prediction...</main>;
  }

  if (!prediction) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-rose-300">{error ?? "Prediction not found."}</main>;
  }

  const thesis = sanitizePredictionThesis(prediction.thesis);
  const isOwner = Boolean(user && user.uid === prediction.userId);
  const createdAtMs = Date.parse(prediction.createdAt);
  const closeRequestedAtMs = Date.parse(prediction.closeRequestedAt ?? "");
  const createCancelWindowOpen = !Number.isNaN(createdAtMs) && now - createdAtMs <= 5 * 60 * 1000;
  const closeCancelWindowOpen = !Number.isNaN(closeRequestedAtMs) && now - closeRequestedAtMs <= 5 * 60 * 1000;
  const canEdit =
    isOwner &&
    (prediction.status === "OPEN" || (prediction.status === "OPENING" && !createCancelWindowOpen));
  const returnText =
    typeof prediction.markReturnValue === "number"
      ? formatReturnPercent(prediction.markReturnValue)
      : "Pending";
  const ownerAction =
    isOwner && prediction.status === "OPENING" && createCancelWindowOpen
      ? { action: "cancel" as const, label: "Cancel" }
      : isOwner && prediction.status === "OPEN"
        ? { action: "close" as const, label: "Close" }
        : isOwner && prediction.status === "CLOSING" && closeCancelWindowOpen
          ? { action: "cancel" as const, label: "Cancel close" }
          : null;

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-[var(--font-sora)] text-2xl font-semibold">
            <Link
              href={`/ticker/${prediction.ticker}`}
              className="flex w-fit items-center gap-1 text-cyan-200 hover:text-cyan-100"
              aria-label={`${prediction.direction === "UP" ? "Up" : "Down"} prediction for ${prediction.ticker}`}
            >
              <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
              <span>{formatTickerSymbol(prediction.ticker)}</span>
            </Link>
          </h1>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-cyan-400/30 px-2.5 py-1 text-xs font-medium text-cyan-100">
              {formatDetailStatus(prediction.status)}
            </span>
            {ownerAction ? (
              <button
                type="button"
                onClick={() => void runPredictionAction(ownerAction.action)}
                disabled={actionPending !== null}
                className="rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionPending === ownerAction.action ? "Working..." : ownerAction.label}
              </button>
            ) : null}
            {canEdit && !editing ? (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:bg-cyan-500/15"
              >
                Edit
              </button>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-slate-400" htmlFor="edit-thesis-title">Title</label>
              <input
                id="edit-thesis-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                maxLength={MAX_PREDICTION_THESIS_TITLE_LENGTH}
                className="rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-400" htmlFor="edit-thesis">Thesis</label>
              <textarea
                id="edit-thesis"
                value={editThesis}
                onChange={(event) => setEditThesis(event.target.value)}
                maxLength={MAX_PREDICTION_THESIS_LENGTH}
                rows={8}
                className="min-h-48 rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              />
              <p className="text-xs text-slate-400">
                {editThesis.trim().length}/{MAX_PREDICTION_THESIS_LENGTH}
              </p>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-slate-400" htmlFor="edit-horizon-unit">Open until</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
                <select
                  id="edit-horizon-unit"
                  value={editHorizonUnit}
                  onChange={(event) => {
                    const nextUnit = event.target.value as "NONE" | PredictionTimeHorizonUnit;
                    setEditHorizonUnit(nextUnit);
                    if (nextUnit === "NONE") {
                      setEditHorizonValue("");
                    }
                  }}
                  className="rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
                >
                  <option value="NONE">No limit</option>
                  <option value="DAYS">Days</option>
                  <option value="MONTHS">Months</option>
                  <option value="YEARS">Years</option>
                </select>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={editHorizonValue}
                  onChange={(event) => setEditHorizonValue(event.target.value)}
                  disabled={editHorizonUnit === "NONE"}
                  placeholder="Value"
                  className="rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveEdits()}
                disabled={editSaving}
                className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={editSaving}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:border-white/30 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-2 font-[var(--font-sora)] text-xl font-semibold text-slate-100">
              {formatPredictionThesisTitle(prediction.thesisTitle)}
            </h2>
            <p className="text-sm text-slate-200">
              <PredictionThesisText text={thesis} />
            </p>
          </>
        )}
        <div className="mt-4 grid gap-6 text-sm text-slate-300 sm:grid-cols-2">
          <dl className="grid gap-1">
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-slate-400">Entry Price:</dt>
              <dd className="text-slate-100">{formatDetailCurrency(prediction.entryPrice)}</dd>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-slate-400">Last Price:</dt>
              <dd className="text-slate-100">{formatDetailCurrency(prediction.markPrice)}</dd>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-slate-400">Return:</dt>
              <dd className={typeof prediction.markReturnValue === "number" ? markToneClass(prediction.markReturnValue) : "text-slate-100"}>
                {returnText}
              </dd>
            </div>
          </dl>

          <dl className="grid gap-1">
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-slate-400">Opened:</dt>
              <dd className="text-slate-100">{formatDetailDate(prediction.entryDate)}</dd>
            </div>
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-slate-400">Last Updated:</dt>
              <dd className="text-slate-100">{formatDetailDate(prediction.markPriceDate)}</dd>
            </div>
          </dl>
        </div>

        {!isOwner ? <PredictionAuthorSummary author={prediction} className="mt-5" /> : null}

        {prediction.result ? (
          <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-900/20 p-3 text-sm text-emerald-50">
            Closed at {prediction.result.exitPrice.toFixed(2)} with return {formatResultReturn(prediction.result)}.
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="mb-3 font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Discussion</h2>

        <div className="mb-4 grid gap-2">
          {comments.map((comment) => (
            <article key={comment.id} className="rounded-xl border border-white/10 p-3">
              <p className="text-sm text-slate-100">{comment.content}</p>
              <p className="mt-2 text-xs text-slate-400">
                {comment.authorNickname ? `@${comment.authorNickname}` : comment.authorDisplayName ?? "Anonymous"} / <RelativeTime value={comment.createdAt} />
              </p>
            </article>
          ))}

          {comments.length === 0 ? <p className="text-sm text-slate-300">No comments yet.</p> : null}
        </div>

        {user ? (
          <div className="grid gap-2">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={3}
              placeholder="Add a thoughtful comment"
              className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
            />
            <button
              type="button"
              onClick={() => void submitComment()}
              className="w-full rounded-full border border-cyan-400/35 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/15 sm:w-fit"
            >
              Post comment
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="inline-block rounded-full border border-cyan-400/35 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/15"
          >
            Sign in to join the discussion
          </Link>
        )}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>
    </main>
  );
}

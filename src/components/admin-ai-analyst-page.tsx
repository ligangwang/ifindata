"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { formatTickerSymbol } from "@/components/prediction-ui";

type DraftStatus = "DRAFT" | "SKIPPED" | "REJECTED" | "PUBLISHED";

type AiPredictionDraft = {
  id: string;
  status: DraftStatus;
  action: "NO_CALL" | "CREATE_CALL";
  ticker: string;
  direction: "UP" | "DOWN" | null;
  confidence: number | null;
  catalyst: string | null;
  thesisTitle: string | null;
  thesis: string | null;
  signals?: string[];
  risks?: string[];
  rationale?: string | null;
  createdAt: string;
  runDate?: string;
  publishedPredictionId?: string | null;
  review?: {
    action?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reason?: string | null;
  } | null;
  validation?: {
    eligibleTicker?: boolean;
    meetsConfidenceThreshold?: boolean;
    hasRequiredFields?: boolean;
  } | null;
};

type AdminStats = {
  users: number;
  predictions: number;
  feedback: number;
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function countFromPayload(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function confidenceText(value: number | null): string {
  if (typeof value !== "number") {
    return "N/A";
  }

  return `${Math.round(value * 100)}%`;
}

function toneForStatus(status: DraftStatus): string {
  if (status === "PUBLISHED") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (status === "REJECTED") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (status === "SKIPPED") {
    return "border-white/15 bg-white/5 text-slate-200";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

export function AdminAiAnalystPage() {
  const { user, loading, getIdToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [drafts, setDrafts] = useState<AiPredictionDraft[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);

  const countLabel = useMemo(() => {
    if (drafts.length === 1) {
      return "1 draft";
    }
    return `${drafts.length} drafts`;
  }, [drafts.length]);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    async function loadAdminData() {
      if (cancelled) {
        return;
      }

      setLoadingData(true);
      setError(null);

      try {
        if (!user) {
          throw new Error("Sign in with an admin account to view AI analyst drafts.");
        }

        const token = await getIdToken();
        if (!token) {
          throw new Error("Sign in with an admin account to view AI analyst drafts.");
        }

        const headers = {
          authorization: `Bearer ${token}`,
        };

        const [statsResponse, draftsResponse] = await Promise.all([
          fetch("/api/admin/stats", { headers }),
          fetch("/api/admin/ai-analyst/drafts?limit=100", { headers }),
        ]);

        const statsPayload = (await statsResponse.json().catch(() => ({}))) as Partial<AdminStats> & {
          error?: string;
        };
        const draftsPayload = (await draftsResponse.json().catch(() => ({}))) as {
          drafts?: AiPredictionDraft[];
          error?: string;
        };

        if (!statsResponse.ok) {
          throw new Error(statsPayload.error ?? "Unable to load admin stats.");
        }

        if (!draftsResponse.ok) {
          throw new Error(draftsPayload.error ?? "Unable to load AI analyst drafts.");
        }

        if (!cancelled) {
          setStats({
            users: countFromPayload(statsPayload.users),
            predictions: countFromPayload(statsPayload.predictions),
            feedback: countFromPayload(statsPayload.feedback),
          });
          setDrafts(draftsPayload.drafts ?? []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load AI analyst drafts.");
          setStats(null);
          setDrafts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [getIdToken, loading, user]);

  async function mutateDraft(draftId: string, action: "approve" | "reject") {
    setPendingDraftId(draftId);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("Sign in with an admin account to review AI drafts.");
      }

      const response = await fetch(`/api/admin/ai-analyst/drafts/${draftId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        status?: DraftStatus;
        predictionId?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update AI draft.");
      }

      setDrafts((prev) =>
        prev.map((draft) =>
          draft.id === draftId
            ? {
                ...draft,
                status: payload.status ?? draft.status,
                publishedPredictionId: payload.predictionId ?? draft.publishedPredictionId ?? null,
                review: {
                  ...(draft.review ?? {}),
                  action: action === "approve" ? "APPROVED" : "REJECTED",
                },
              }
            : draft,
        ),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update AI draft.");
    } finally {
      setPendingDraftId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="mb-3 text-sm font-medium text-cyan-200">Admin</p>

      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-4">
          <p className="text-xs uppercase text-slate-500">Users</p>
          <p className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
            {stats ? formatCount(stats.users) : <>&mdash;</>}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-4">
          <p className="text-xs uppercase text-slate-500">Predictions</p>
          <p className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
            {stats ? formatCount(stats.predictions) : <>&mdash;</>}
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-4">
          <p className="text-xs uppercase text-slate-500">Feedback</p>
          <p className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
            {stats ? formatCount(stats.feedback) : <>&mdash;</>}
          </p>
        </div>
      </section>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">AI analyst drafts</h1>
          <p className="mt-2 text-sm text-slate-300">
            Review generated AI analyst calls before they are published to the feed.
          </p>
        </div>
        <Link
          href="/how-it-works"
          className="w-fit rounded-xl border border-cyan-400/35 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/15"
        >
          View methodology
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_8px_40px_rgba(8,47,73,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <p className="text-sm font-medium text-slate-200">{loadingData ? "Loading..." : countLabel}</p>
          <p className="text-xs text-slate-500">Latest 100</p>
        </div>

        {error ? (
          <div className="px-5 py-8 text-sm text-rose-300">{error}</div>
        ) : loadingData ? (
          <div className="px-5 py-8 text-sm text-slate-300">Loading AI analyst drafts...</div>
        ) : drafts.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-300">No AI analyst drafts yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {drafts.map((draft) => (
              <article key={draft.id} className="grid gap-4 px-5 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneForStatus(draft.status)}`}>
                        {draft.status}
                      </span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {draft.action}
                      </span>
                      {draft.direction ? (
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                          {draft.direction}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-semibold text-white">
                      {formatTickerSymbol(draft.ticker)} {draft.thesisTitle ? `- ${draft.thesisTitle}` : ""}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">{draft.id}</p>
                  </div>
                  <div className="text-sm text-slate-400">
                    <p>Run date: {draft.runDate ?? "Unknown"}</p>
                    <p>Created: {formatDateTime(draft.createdAt)}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Confidence</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">{confidenceText(draft.confidence)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Catalyst</p>
                    <p className="mt-1 text-sm text-slate-200">{draft.catalyst ?? "None"}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Validation</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {draft.validation?.eligibleTicker === false ? "Outside universe" : "Eligible ticker"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {draft.validation?.meetsConfidenceThreshold === false ? "Below threshold" : "Confidence ok"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3">
                    <p className="text-xs uppercase text-slate-500">Publish</p>
                    {draft.publishedPredictionId ? (
                      <Link
                        href={`/predictions/${draft.publishedPredictionId}`}
                        className="mt-1 inline-block text-sm font-medium text-cyan-200 hover:text-cyan-100"
                      >
                        View published prediction
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-slate-300">Not published</p>
                    )}
                  </div>
                </div>

                {draft.thesis ? (
                  <div>
                    <p className="text-xs uppercase text-slate-500">Thesis</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{draft.thesis}</p>
                  </div>
                ) : null}

                {draft.rationale ? (
                  <div>
                    <p className="text-xs uppercase text-slate-500">Rationale</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{draft.rationale}</p>
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-slate-500">Signals</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(draft.signals ?? []).length > 0 ? (
                        draft.signals?.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100"
                          >
                            {signal}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Risks</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(draft.risks ?? []).length > 0 ? (
                        draft.risks?.map((risk) => (
                          <span
                            key={risk}
                            className="rounded-full border border-rose-400/25 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-100"
                          >
                            {risk}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void mutateDraft(draft.id, "approve")}
                    disabled={pendingDraftId === draft.id || draft.status !== "DRAFT"}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingDraftId === draft.id ? "Saving..." : "Approve & publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void mutateDraft(draft.id, "reject")}
                    disabled={pendingDraftId === draft.id || draft.status !== "DRAFT"}
                    className="rounded-lg border border-rose-400/35 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                  {draft.review?.action ? (
                    <p className="text-xs text-slate-500">
                      Last review: {draft.review.action} {draft.review.reviewedAt ? `on ${formatDateTime(draft.review.reviewedAt)}` : ""}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


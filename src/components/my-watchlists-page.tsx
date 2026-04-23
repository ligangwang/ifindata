"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { formatTickerSymbol, PredictionReturnSummary } from "@/components/prediction-ui";
import { type PredictionStatus } from "@/lib/predictions/types";

type WatchlistPrediction = {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  thesisTitle?: string;
  thesis: string;
  status: PredictionStatus;
  createdAt: string;
  entryPrice: number | null;
  entryDate: string | null;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markReturnValue?: number | null;
  commentCount: number;
  result: {
    returnValue: number;
    score: number;
  } | null;
};

type WatchlistMetrics = {
  liveReturn: number | null;
  settledReturn: number | null;
  livePredictionCount: number;
  settledPredictionCount: number;
};

type WatchlistSummary = {
  id: string;
  name: string;
  description?: string | null;
  metrics: WatchlistMetrics;
};

type WatchlistDetail = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  metrics: WatchlistMetrics;
  livePredictions: WatchlistPrediction[];
  settledPredictions: WatchlistPrediction[];
};

type StatusFilter = "ALL" | "LIVE" | "SETTLED";

function watchlistReturnText(value: number | null): string {
  if (typeof value !== "number") {
    return "Not marked";
  }
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function statusFilterLabel(status: StatusFilter): string {
  if (status === "LIVE") {
    return "Live";
  }
  if (status === "SETTLED") {
    return "Settled";
  }
  return "All";
}

function predictionStatusLabel(status: PredictionStatus): string {
  if (status === "CREATED") {
    return "Awaiting entry";
  }
  if (status === "OPEN") {
    return "Live";
  }
  if (status === "CLOSING") {
    return "Closing";
  }
  if (status === "SETTLED") {
    return "Settled";
  }
  return "Canceled";
}

function WatchlistPredictionRow({ prediction }: { prediction: WatchlistPrediction }) {
  const title = prediction.thesisTitle?.trim();

  return (
    <article className="border-t border-white/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/predictions/${prediction.id}`}
            className="flex w-fit items-center gap-1 text-base font-semibold text-cyan-200 hover:text-cyan-100"
          >
            <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
            <span>{formatTickerSymbol(prediction.ticker)}</span>
          </Link>
          {title ? <p className="mt-1 truncate text-sm text-slate-300">{title}</p> : null}
          <PredictionReturnSummary prediction={prediction} href={`/predictions/${prediction.id}`} status={prediction.status} />
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{predictionStatusLabel(prediction.status)}</p>
          <p className="mt-1">{prediction.commentCount.toLocaleString()} comments</p>
        </div>
      </div>
    </article>
  );
}

export function MyWatchlistsPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistDetail | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const watchlistRequestIdRef = useRef(0);

  const selectedSummary = useMemo(
    () => watchlists.find((item) => item.id === selectedWatchlistId) ?? null,
    [selectedWatchlistId, watchlists],
  );
  const selectedMetrics = watchlist?.metrics ?? selectedSummary?.metrics ?? null;
  const selectedPredictions =
    watchlist && status === "LIVE"
      ? watchlist.livePredictions
      : watchlist && status === "SETTLED"
        ? watchlist.settledPredictions
        : watchlist
          ? [...watchlist.livePredictions, ...watchlist.settledPredictions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          : [];

  async function loadWatchlistDetail(nextWatchlistId: string) {
    const requestId = watchlistRequestIdRef.current + 1;
    watchlistRequestIdRef.current = requestId;
    setSelectedWatchlistId(nextWatchlistId);
    setLoadingDetail(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlists/${nextWatchlistId}`);
      if (!response.ok) {
        throw new Error("Unable to load watchlist.");
      }

      const payload = (await response.json()) as { watchlist: WatchlistDetail };
      if (watchlistRequestIdRef.current !== requestId) {
        return;
      }
      setWatchlist(payload.watchlist);
      setEditName(payload.watchlist.name);
      setEditDescription(payload.watchlist.description ?? "");
    } catch (nextError) {
      if (watchlistRequestIdRef.current !== requestId) {
        return;
      }
      setError(nextError instanceof Error ? nextError.message : "Unable to load watchlist.");
      setWatchlist(null);
    } finally {
      if (watchlistRequestIdRef.current === requestId) {
        setLoadingDetail(false);
      }
    }
  }

  async function loadWorkspace(ownerId: string, preferredWatchlistId?: string | null) {
    setLoadingWorkspace(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlists?userId=${encodeURIComponent(ownerId)}`);
      if (!response.ok) {
        throw new Error("Unable to load watchlists.");
      }

      const payload = (await response.json()) as { items: WatchlistSummary[] };
      setWatchlists(payload.items);

      const fallbackId =
        (preferredWatchlistId && payload.items.some((item) => item.id === preferredWatchlistId) ? preferredWatchlistId : null) ??
        (selectedWatchlistId && payload.items.some((item) => item.id === selectedWatchlistId) ? selectedWatchlistId : null) ??
        payload.items[0]?.id ??
        null;

      if (fallbackId) {
        await loadWatchlistDetail(fallbackId);
      } else {
        setSelectedWatchlistId(null);
        setWatchlist(null);
        setEditName("");
        setEditDescription("");
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load watchlists.");
      setWatchlists([]);
      setSelectedWatchlistId(null);
      setWatchlist(null);
    } finally {
      setLoadingWorkspace(false);
    }
  }

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      watchlistRequestIdRef.current += 1;
      setWatchlists([]);
      setSelectedWatchlistId(null);
      setWatchlist(null);
      setEditName("");
      setEditDescription("");
      setComposerOpen(false);
      setEditing(false);
      setError(null);
      setLoadingWorkspace(false);
      setLoadingDetail(false);
      return;
    }

    void loadWorkspace(user.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]);

  async function createWatchlist() {
    if (!user) {
      setError("Sign in to create a watchlist.");
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setError("Sign in to create a watchlist.");
      return;
    }

    const name = newWatchlistName.trim();
    const description = newWatchlistDescription.trim();
    if (!name) {
      setError("Watchlist name is required.");
      return;
    }

    setCreatingWatchlist(true);
    setError(null);

    try {
      const response = await fetch("/api/watchlists", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || null,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Failed to create watchlist.");
      }

      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setComposerOpen(false);
      await loadWorkspace(user.uid, payload.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create watchlist.");
    } finally {
      setCreatingWatchlist(false);
    }
  }

  function startEditing() {
    if (!watchlist) {
      return;
    }

    setEditName(watchlist.name);
    setEditDescription(watchlist.description ?? "");
    setEditing(true);
    setError(null);
  }

  async function saveWatchlist() {
    if (!user || !watchlist) {
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setError("Sign in to edit this watchlist.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/watchlists/${watchlist.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update watchlist.");
      }

      setEditing(false);
      await loadWorkspace(user.uid, watchlist.id);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update watchlist.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-6 text-center shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
          <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">My Watchlists</h1>
          <p className="mt-3 text-sm text-slate-300">Sign in to create watchlists, organize predictions, and manage your public research workspace.</p>
          <Link
            href="/auth"
            className="mt-6 inline-flex rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  if (authLoading || loadingWorkspace) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-slate-300">Loading watchlists...</main>;
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">Workspace</p>
            <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">My Watchlists</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Create, edit, and review the public watchlists that organize your predictions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {watchlists.length < 5 ? (
              <button
                type="button"
                onClick={() => {
                  setComposerOpen((current) => !current);
                  setError(null);
                }}
                className="rounded-full border border-cyan-400/35 px-3 py-1.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/15"
              >
                {composerOpen ? "Close" : "New watchlist"}
              </button>
            ) : null}
            <Link
              href={selectedWatchlistId ? `/predictions/new?watchlistId=${encodeURIComponent(selectedWatchlistId)}` : "/predictions/new"}
              className="rounded-full bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Add prediction
            </Link>
          </div>
        </div>

        {composerOpen ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <input
                type="text"
                value={newWatchlistName}
                onChange={(event) => setNewWatchlistName(event.target.value)}
                maxLength={80}
                placeholder="Watchlist name"
                className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              />
              <input
                type="text"
                value={newWatchlistDescription}
                onChange={(event) => setNewWatchlistDescription(event.target.value)}
                maxLength={240}
                placeholder="Optional description"
                className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              />
              <button
                type="button"
                onClick={() => void createWatchlist()}
                disabled={creatingWatchlist}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {creatingWatchlist ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      {watchlists.length > 0 ? (
        <>
          <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
            <div className="flex flex-wrap gap-2">
              {watchlists.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadWatchlistDetail(item.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    selectedWatchlistId === item.id
                      ? "bg-cyan-500 text-slate-950"
                      : "border border-white/10 text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </section>

          {selectedSummary ? (
            <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
              {editing ? (
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <label className="text-xs text-slate-400" htmlFor="edit-watchlist-name">Name</label>
                    <input
                      id="edit-watchlist-name"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      maxLength={80}
                      className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs text-slate-400" htmlFor="edit-watchlist-description">Description</label>
                    <textarea
                      id="edit-watchlist-description"
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      maxLength={500}
                      rows={3}
                      className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void saveWatchlist()}
                      disabled={saving}
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setEditName(watchlist?.name ?? selectedSummary.name);
                        setEditDescription(watchlist?.description ?? selectedSummary.description ?? "");
                      }}
                      disabled={saving}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:border-white/30 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
                        {selectedSummary.name}
                      </h2>
                      <Link
                        href={`/analysts/${user.uid}/watchlists/${selectedSummary.id}`}
                        className="text-xs font-medium text-cyan-300 hover:text-cyan-100"
                      >
                        View public page
                      </Link>
                    </div>
                    {selectedSummary.description ? (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{selectedSummary.description}</p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No description yet.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15"
                    >
                      Edit watchlist
                    </button>
                    <Link
                      href={selectedWatchlistId ? `/predictions/new?watchlistId=${encodeURIComponent(selectedWatchlistId)}` : "/predictions/new"}
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Add prediction
                    </Link>
                  </div>
                </div>
              )}

              {selectedMetrics ? (
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Live return</p>
                    <p className="mt-1 font-semibold text-cyan-100">{watchlistReturnText(selectedMetrics.liveReturn)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Settled return</p>
                    <p className="mt-1 font-semibold text-cyan-100">{watchlistReturnText(selectedMetrics.settledReturn)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Live</p>
                    <p className="mt-1 font-semibold text-slate-100">{selectedMetrics.livePredictionCount.toLocaleString()} predictions</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Settled</p>
                    <p className="mt-1 font-semibold text-slate-100">{selectedMetrics.settledPredictionCount.toLocaleString()} predictions</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Predictions</h3>
                <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs">
                  {(["ALL", "LIVE", "SETTLED"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatus(option)}
                      className={`rounded-full px-3 py-1.5 transition ${
                        status === option ? "bg-cyan-500 text-slate-950" : "text-slate-200 hover:text-white"
                      }`}
                    >
                      {statusFilterLabel(option)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                {loadingDetail ? (
                  <p className="text-sm text-slate-300">Loading watchlist...</p>
                ) : selectedPredictions.length > 0 ? (
                  <div>
                    {selectedPredictions.map((prediction) => (
                      <WatchlistPredictionRow key={prediction.id} prediction={prediction} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">
                    {status === "LIVE"
                      ? "No live predictions in this watchlist."
                      : status === "SETTLED"
                        ? "No settled predictions in this watchlist."
                        : "No predictions in this watchlist yet."}
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
          <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
            Create your first watchlist to organize your predictions.
          </p>
        </section>
      )}
    </main>
  );
}

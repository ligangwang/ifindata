"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { sanitizePredictionThesis } from "@/lib/predictions/types";

type Prediction = {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  thesis: string;
  createdAt: string;
  expiryAt: string;
  status: "ACTIVE" | "SETTLED";
  result: {
    score: number;
  } | null;
};

type ProfilePayload = {
  profile: {
    id: string;
    displayName: string | null;
    photoURL: string | null;
    nickname: string | null;
    bio: string;
    stats: {
      totalPredictions: number;
      activePredictions: number;
      settledPredictions: number;
      totalScore: number;
    };
  };
  predictions: Prediction[];
  nextCursor: string | null;
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${(score / 100).toFixed(2)}%`;
}

export function AnalystProfilePage({ userId }: { userId: string }) {
  const { user, getIdToken } = useAuth();
  const isOwner = Boolean(user && user.uid === userId);
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "SETTLED">("ALL");
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const preferredName = payload?.profile.nickname ?? payload?.profile.displayName ?? "Analyst";

  async function fetchProfile(cursorCreatedAt?: string): Promise<ProfilePayload> {
    const params = new URLSearchParams();
    if (status !== "ALL") {
      params.set("status", status);
    }
    if (cursorCreatedAt) {
      params.set("cursorCreatedAt", cursorCreatedAt);
    }

    const token = await getIdToken();
    const response = await fetch(`/api/users/${userId}?${params.toString()}`, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error("Unable to load analyst profile.");
    }

    return (await response.json()) as ProfilePayload;
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchProfile()
      .then((nextPayload) => {
        if (!cancelled) {
          setPayload(nextPayload);
          setLoading(false);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load profile.");
          setPayload(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getIdToken, status, userId]);

  async function loadMorePredictions() {
    if (!payload?.nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPayload = await fetchProfile(payload.nextCursor);
      setPayload((prev) => {
        if (!prev) {
          return nextPayload;
        }

        return {
          ...prev,
          predictions: [...prev.predictions, ...nextPayload.predictions],
          nextCursor: nextPayload.nextCursor,
        };
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load more predictions.");
    } finally {
      setLoadingMore(false);
    }
  }

  function startEditing() {
    if (!payload) return;
    setEditNickname(payload.profile.nickname ?? "");
    setEditBio(payload.profile.bio);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setSaveError(null);
  }

  async function saveProfile() {
    if (!payload) return;
    setSaving(true);
    setSaveError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated.");

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: editNickname.trim() || null,
          bio: editBio.trim(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to save profile.");
      }

      setPayload((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                nickname: editNickname.trim() || null,
                bio: editBio.trim(),
              },
            }
          : prev,
      );
      setEditing(false);
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !payload) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-slate-300">
        {error ?? "Loading profile..."}
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {payload.profile.photoURL ? (
              <img
                src={payload.profile.photoURL}
                alt={`${preferredName} avatar`}
                className="h-12 w-12 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-sm text-cyan-200">
                {preferredName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
              {payload.profile.nickname ? `@${payload.profile.nickname}` : preferredName}
            </h1>
          </div>
          {isOwner && !editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200"
            >
              Edit profile
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="edit-nickname">
                Nickname
              </label>
              <input
                id="edit-nickname"
                type="text"
                maxLength={30}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="your_handle"
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="edit-bio">
                Bio
              </label>
              <textarea
                id="edit-bio"
                maxLength={500}
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="w-full resize-none rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            {saveError ? <p className="text-xs text-rose-400">{saveError}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={saving}
                className="rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-slate-300 hover:border-white/25 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-300">{payload.profile.bio || "No bio yet."}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total Score</p>
            <p className="font-semibold text-cyan-100">{scoreText(payload.profile.stats.totalScore)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.totalPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Active</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.activePredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Settled</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.settledPredictions}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Prediction history</h2>
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs">
            {(["ALL", "ACTIVE", "SETTLED"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-full px-3 py-1.5 transition ${
                  status === option ? "bg-cyan-500 text-slate-950" : "text-slate-200 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          {payload.predictions.map((prediction) => (
            <Link
              key={prediction.id}
              href={`/predictions/${prediction.id}`}
              className="rounded-xl border border-white/10 p-3 hover:border-cyan-300/60"
            >
              <p className="text-sm text-slate-100">
                {prediction.ticker} · {prediction.direction} · {prediction.status}
              </p>
              <p className="mt-1 line-clamp-2 break-words text-xs text-slate-300">
                {sanitizePredictionThesis(prediction.thesis) || "No thesis provided."}
              </p>
              <p className="mt-1 break-words text-xs text-slate-400">
                Created {new Date(prediction.createdAt).toLocaleString()} · Expires {new Date(prediction.expiryAt).toLocaleString()}
              </p>
              {prediction.result ? (
                <p className="mt-1 text-xs text-emerald-200">Result {scoreText(prediction.result.score)}</p>
              ) : null}
            </Link>
          ))}

          {payload.predictions.length === 0 ? <p className="text-sm text-slate-300">No predictions yet.</p> : null}

          {payload.nextCursor ? (
            <button
              type="button"
              onClick={() => void loadMorePredictions()}
              disabled={loadingMore}
              className="mt-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { DirectionBadge, formatPredictionStatus, PredictionMarkSummary } from "@/components/prediction-ui";
import { sanitizePredictionThesis, type PredictionStatus } from "@/lib/predictions/types";

type ProfileStatusFilter = "ALL" | PredictionStatus;

type Prediction = {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  entryPrice: number | null;
  entryDate: string | null;
  thesis: string;
  createdAt: string;
  status: PredictionStatus;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markDisplayPercent?: number | null;
  commentCount: number;
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
      openingPredictions: number;
      openPredictions: number;
      closingPredictions: number;
      closedPredictions: number;
      canceledPredictions: number;
      totalScore: number;
      followersCount: number;
      followingCount: number;
    };
  };
  relationship: {
    isFollowing: boolean;
  };
  predictions: Prediction[];
  nextCursor: string | null;
};

function basisPointText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)} bp`;
}

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${(score / 100).toFixed(2)}%`;
}

function statusFilterLabel(status: ProfileStatusFilter): string {
  return status === "ALL" ? "All" : formatPredictionStatus(status);
}

function countText(count: number, singular: string, plural = `${singular}s`): string {
  const rounded = Math.max(0, Math.round(count));
  return `${rounded.toLocaleString()} ${rounded === 1 ? singular : plural}`;
}

export function AnalystProfilePage({
  userId,
  promptForNickname = false,
}: {
  userId: string;
  promptForNickname?: boolean;
}) {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const isOwner = Boolean(user && user.uid === userId);
  const [status, setStatus] = useState<ProfileStatusFilter>("ALL");
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nicknamePromptOpened, setNicknamePromptOpened] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!promptForNickname || nicknamePromptOpened || editing || !isOwner || !payload || payload.profile.nickname) {
      return;
    }

    setEditNickname("");
    setEditBio(payload.profile.bio);
    setSaveError(null);
    setEditing(true);
    setNicknamePromptOpened(true);
  }, [editing, isOwner, nicknamePromptOpened, payload, promptForNickname]);

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

  async function toggleFollow() {
    if (!payload || isOwner) return;

    setFollowSaving(true);
    setFollowError(null);

    const wasFollowing = payload.relationship.isFollowing;

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Sign in to follow analysts.");

      const response = await fetch(`/api/users/${userId}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Unable to update follow.");
      }

      setPayload((prev) => {
        if (!prev) return prev;
        const nextIsFollowing = !wasFollowing;
        const followersDelta = nextIsFollowing ? 1 : -1;

        return {
          ...prev,
          relationship: {
            isFollowing: nextIsFollowing,
          },
          profile: {
            ...prev.profile,
            stats: {
              ...prev.profile.stats,
              followersCount: Math.max(0, prev.profile.stats.followersCount + followersDelta),
            },
          },
        };
      });
    } catch (nextError) {
      setFollowError(nextError instanceof Error ? nextError.message : "Unable to update follow.");
    } finally {
      setFollowSaving(false);
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
            <div>
              <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
                {payload.profile.nickname ? `@${payload.profile.nickname}` : preferredName}
              </h1>
              <nav className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400" aria-label="Profile follow lists">
                <Link href={`/analysts/${userId}/followers`} className="hover:text-cyan-200">
                  {countText(payload.profile.stats.followersCount, "follower")}
                </Link>
                <span aria-hidden="true">/</span>
                <Link href={`/analysts/${userId}/following`} className="hover:text-cyan-200">
                  {countText(payload.profile.stats.followingCount, "following", "following")}
                </Link>
              </nav>
            </div>
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
          {!isOwner && !authLoading && user ? (
            <button
              type="button"
              onClick={() => void toggleFollow()}
              disabled={followSaving}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                payload.relationship.isFollowing
                  ? "border border-white/10 text-slate-300 hover:border-rose-400/40 hover:text-rose-200"
                  : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              }`}
            >
              {followSaving ? "Saving..." : payload.relationship.isFollowing ? "Unfollow" : "Follow"}
            </button>
          ) : null}
          {!isOwner && !authLoading && !user ? (
            <Link
              href="/auth"
              className="shrink-0 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Sign in to follow
            </Link>
          ) : null}
        </div>
        {followError ? <p className="mt-2 text-xs text-rose-300">{followError}</p> : null}

        {editing ? (
          <div className="mt-3 grid gap-3">
            {promptForNickname && !payload.profile.nickname ? (
              <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                Choose a nickname. This is the name people will see publicly on Younalyst.
              </p>
            ) : null}
            <div>
              <label className="mb-1 block text-xs text-slate-400" htmlFor="edit-nickname">
                Nickname
              </label>
              <p className="mb-2 text-xs text-slate-500">This is the name people will see publicly on Younalyst.</p>
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
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total Score</p>
            <p className="font-semibold text-cyan-100">{basisPointText(payload.profile.stats.totalScore)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.totalPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Opening</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.openingPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Open</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.openPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Closing</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.closingPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Closed</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.closedPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Canceled</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.canceledPredictions}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Prediction history</h2>
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs">
            {(["ALL", "OPENING", "OPEN", "CLOSING", "CLOSED", "CANCELED"] as const).map((option) => (
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
        <div className="grid gap-2">
          {payload.predictions.map((prediction) => (
            <Link
              key={prediction.id}
              href={`/predictions/${prediction.id}`}
              className="rounded-xl border border-white/10 p-3 hover:border-cyan-300/60"
            >
              <p className="flex flex-wrap items-center gap-1 text-sm text-slate-100">
                <span>{prediction.ticker}</span>
                <span className="text-slate-500">/</span>
                <DirectionBadge direction={prediction.direction} />
                <span className="text-slate-500">/</span>
                <span>{formatPredictionStatus(prediction.status)}</span>
              </p>
              <p className="mt-1 line-clamp-2 break-words text-xs text-slate-300">
                {sanitizePredictionThesis(prediction.thesis) || "No thesis provided."}
              </p>
              <p className="mt-1 break-words text-xs text-slate-400">
                Created {new Date(prediction.createdAt).toLocaleString()}
              </p>
              {prediction.result ? (
                <p className="mt-1 text-xs text-emerald-200">Result {scoreText(prediction.result.score)}</p>
              ) : null}
              <PredictionMarkSummary prediction={prediction} />
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


"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type PredictionDetail = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  ticker: string;
  direction: "UP" | "DOWN";
  entryPrice: number;
  expiryAt: string;
  thesis: string;
  status: "ACTIVE" | "SETTLED";
  createdAt: string;
  result: {
    score: number;
    exitPrice: number;
  } | null;
};

type PredictionComment = {
  id: string;
  authorDisplayName: string | null;
  content: string;
  createdAt: string;
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${(score / 100).toFixed(2)}%`;
}

export function PredictionDetailPage({ predictionId }: { predictionId: string }) {
  const { getIdToken, user } = useAuth();
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [comments, setComments] = useState<PredictionComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [predictionResponse, commentResponse] = await Promise.all([
        fetch(`/api/predictions/${predictionId}`),
        fetch(`/api/predictions/${predictionId}/comments?limit=100`),
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

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-slate-300">Loading prediction...</main>;
  }

  if (!prediction) {
    return <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-rose-300">{error ?? "Prediction not found."}</main>;
  }

  return (
    <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
            {prediction.ticker} · {prediction.direction}
          </h1>
          <p className="text-sm text-slate-300">{prediction.status}</p>
        </div>

        <p className="text-sm text-slate-200">{prediction.thesis || "No thesis provided."}</p>

        <div className="mt-4 grid gap-1 text-sm text-slate-300 md:grid-cols-2">
          <p>Author: {prediction.authorDisplayName ?? "Anonymous"}</p>
          <p>Created: {new Date(prediction.createdAt).toLocaleString()}</p>
          <p>Entry: {prediction.entryPrice.toFixed(2)}</p>
          <p>Expiry: {new Date(prediction.expiryAt).toLocaleString()}</p>
        </div>

        {prediction.result ? (
          <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-900/20 p-3 text-sm text-emerald-50">
            Settled at {prediction.result.exitPrice.toFixed(2)} with score {scoreText(prediction.result.score)}.
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
                {comment.authorDisplayName ?? "Anonymous"} · {new Date(comment.createdAt).toLocaleString()}
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
          <p className="text-sm text-slate-300">Sign in to join the discussion.</p>
        )}

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>
    </main>
  );
}

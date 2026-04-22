"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type AdminStats = {
  users: number;
  predictions: number;
  feedback: number;
};

function formatCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString();
}

function countFromPayload(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function AdminDashboardPage() {
  const { user, loading, getIdToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    let cancelled = false;

    async function loadStats() {
      try {
        if (!user) {
          throw new Error("Sign in with an admin account to view admin tools.");
        }

        const token = await getIdToken();
        if (!token) {
          throw new Error("Sign in with an admin account to view admin tools.");
        }

        const response = await fetch("/api/admin/stats", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json().catch(() => ({}))) as Partial<AdminStats> & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load admin stats.");
        }

        if (!cancelled) {
          setStats({
            users: countFromPayload(payload.users),
            predictions: countFromPayload(payload.predictions),
            feedback: countFromPayload(payload.feedback),
          });
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load admin stats.");
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [getIdToken, loading, user]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <p className="mb-3 text-sm font-medium text-cyan-200">Admin</p>

      <div className="mb-6 max-w-3xl">
        <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Manage AI analyst drafts and review user feedback from one place.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
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

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/ai-analyst"
          className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5 transition hover:border-cyan-300/50 hover:bg-slate-900"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">AI Analyst</p>
          <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Review generated drafts</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Approve or reject AI-generated calls before they appear in the public feed.
          </p>
        </Link>

        <Link
          href="/admin/feedback"
          className="rounded-2xl border border-white/15 bg-slate-900/70 p-5 transition hover:border-cyan-300/50 hover:bg-slate-900"
        >
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">Feedback</p>
          <h2 className="mt-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Review user submissions</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Read feature requests, bug reports, and suggestions submitted by users.
          </p>
        </Link>
      </section>
    </main>
  );
}


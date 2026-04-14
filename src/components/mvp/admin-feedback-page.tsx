"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type FeedbackCategory = "FEATURE_REQUEST" | "BUG_REPORT" | "SUGGESTION";

type FeedbackSubmission = {
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  contactEmail: string | null;
  status: string;
  source: string | null;
  userId: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
};

const categoryLabels: Record<FeedbackCategory, string> = {
  FEATURE_REQUEST: "Feature request",
  BUG_REPORT: "Bug report",
  SUGGESTION: "Suggestion",
};

function formatDate(value: string): string {
  if (!value) {
    return "Unknown date";
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

function submitterLabel(submission: FeedbackSubmission): string {
  return submission.userDisplayName || submission.userEmail || submission.contactEmail || "Anonymous";
}

export function AdminFeedbackPage() {
  const { user, loading, getIdToken } = useAuth();
  const [submissions, setSubmissions] = useState<FeedbackSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countLabel = useMemo(() => {
    if (submissions.length === 1) {
      return "1 submission";
    }

    return `${submissions.length} submissions`;
  }, [submissions.length]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setSubmissions([]);
      setError("Sign in with an admin account to view feedback.");
      return;
    }

    let cancelled = false;

    async function loadSubmissions() {
      setLoadingSubmissions(true);
      setError(null);

      try {
        const token = await getIdToken();

        if (!token) {
          throw new Error("Sign in with an admin account to view feedback.");
        }

        const response = await fetch("/api/feedback", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json().catch(() => ({}))) as {
          submissions?: FeedbackSubmission[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load feedback.");
        }

        if (!cancelled) {
          setSubmissions(payload.submissions ?? []);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load feedback.");
          setSubmissions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubmissions(false);
        }
      }
    }

    void loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, [getIdToken, loading, user]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-cyan-200">Admin</p>
          <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">Feedback submissions</h1>
          <p className="mt-2 text-sm text-slate-300">Review the latest notes sent from the public feedback page.</p>
        </div>
        <Link
          href="/feedback"
          className="w-fit rounded-xl border border-cyan-400/35 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/15"
        >
          Submit feedback
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_8px_40px_rgba(8,47,73,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <p className="text-sm font-medium text-slate-200">{loadingSubmissions ? "Loading..." : countLabel}</p>
          <p className="text-xs text-slate-500">Latest 100</p>
        </div>

        {error ? (
          <div className="px-5 py-8 text-sm text-rose-300">{error}</div>
        ) : loadingSubmissions ? (
          <div className="px-5 py-8 text-sm text-slate-300">Loading feedback...</div>
        ) : submissions.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-300">No feedback has been submitted yet.</div>
        ) : (
          <div className="divide-y divide-white/10">
            {submissions.map((submission) => (
              <article key={submission.id} className="grid gap-4 px-5 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                        {categoryLabels[submission.category]}
                      </span>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {submission.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white">{submission.subject}</h2>
                    <p className="mt-1 text-xs text-slate-500">{submission.id}</p>
                  </div>
                  <time className="text-sm text-slate-400" dateTime={submission.createdAt}>
                    {formatDate(submission.createdAt)}
                  </time>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{submission.message}</p>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase text-slate-500">From</dt>
                    <dd className="mt-1 text-slate-200">{submitterLabel(submission)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Contact</dt>
                    <dd className="mt-1 text-slate-200">{submission.contactEmail ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">User ID</dt>
                    <dd className="mt-1 break-all text-slate-200">{submission.userId ?? "Anonymous"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">User agent</dt>
                    <dd className="mt-1 break-words text-slate-400">{submission.userAgent ?? "Unknown"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

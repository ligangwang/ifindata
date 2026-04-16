import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works | YouAnalyst",
  description: "How YouAnalyst predictions open, mark, close, and score using end-of-day prices.",
};

const lifecycle = [
  {
    status: "Opening",
    description: "Your prediction is waiting for the next eligible end-of-day entry price.",
  },
  {
    status: "Open",
    description: "The entry price is set and the prediction is marked daily with end-of-day prices.",
  },
  {
    status: "Closing",
    description: "You requested a close and the final result is waiting for the next eligible end-of-day price.",
  },
  {
    status: "Closed",
    description: "The final price, result, and score are locked.",
  },
  {
    status: "Canceled",
    description: "The prediction was canceled before entry.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <section className="border-b border-white/10 pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">How It Works</p>
        <h1 className="mt-2 font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">
          Predictions run on end-of-day prices.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          YouAnalyst keeps prediction timing simple. Create and close requests do not use realtime quotes. The daily
          end-of-day run assigns entry prices, updates marks, closes requested predictions, and calculates scores.
        </p>
      </section>

      <section className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-3">
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Make a prediction</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Pick a ticker, choose up or down, and write your thesis. The prediction starts as Opening.
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Track the mark</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Once opened, the prediction receives a daily mark price and provisional score from end-of-day data.
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Close when ready</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Request a close any time. The next eligible end-of-day run locks the final result and score.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 py-6">
        <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Status Guide</h2>
        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
          {lifecycle.map((item) => (
            <div key={item.status} className="grid gap-2 py-3 text-sm sm:grid-cols-[140px_1fr]">
              <p className="font-semibold text-cyan-200">{item.status}</p>
              <p className="leading-6 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 py-6 md:grid-cols-2">
        <div>
          <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">How Scores Work</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Score is based on the return from entry price to mark or final price. One basis point of return equals one
            score point. Up predictions score when the price rises. Down predictions score when the price falls.
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Why End-of-Day</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            End-of-day pricing keeps timing consistent, avoids random intraday quote differences, and makes every
            prediction easier to compare on the leaderboard.
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border-t border-white/10 pt-6">
        <Link
          href="/predictions/new"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Make a prediction
        </Link>
        <Link
          href="/predictions"
          className="rounded-lg border border-cyan-400/35 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/15"
        >
          View feed
        </Link>
      </section>
    </main>
  );
}

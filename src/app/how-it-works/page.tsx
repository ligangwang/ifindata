import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works | YouAnalyst",
  description: "How YouAnalyst predictions, scores, XP, and levels work.",
};

const lifecycle = [
  {
    status: "Live",
    description: "Active and updated daily.",
  },
  {
    status: "Settled",
    description: "Settled result and score are locked.",
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
          Make predictions on stocks. We track results using end-of-day prices to keep everything fair and consistent.
        </p>
      </section>

      <section className="grid gap-4 border-b border-white/10 py-6 md:grid-cols-3">
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Make a prediction</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Pick a stock, choose Up or Down, and share your view.
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Track the mark</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            We update your prediction daily using end-of-day prices.
          </p>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Close when ready</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Close your prediction anytime. The next end-of-day update locks the settled result.
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
          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
            <p>Your Score reflects how your predictions perform.</p>
            <p>Strong calls help your Score. Poor calls can hold it back.</p>
            <p>Rankings are based on overall Score.</p>
          </div>
        </div>
        <div>
          <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Level & XP</h2>
          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
            <p>You earn XP from settled predictions.</p>
            <p>XP increases your Level, which reflects your experience over time.</p>
            <p>Level does not affect ranking.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-6">
        <div className="max-w-2xl">
          <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Why End-of-Day</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            End-of-day pricing keeps results consistent and comparable across all users.
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

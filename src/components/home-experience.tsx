"use client";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { featuredCompanies, type FeaturedCompany } from "@/lib/featured-companies";
import { getFirebaseServices } from "@/lib/firebase/client";

type LovedEntity = FeaturedCompany & {
  lovedAtLabel: string;
};

const sectors = [
  { name: "Technology", color: "bg-cyan-500" },
  { name: "Healthcare", color: "bg-emerald-500" },
  { name: "Industrials", color: "bg-amber-500" },
  { name: "Consumer", color: "bg-rose-500" },
];

const features = [
  {
    title: "Economic graph first",
    description:
      "Explore public companies through sector clusters, relationship paths, and business model context instead of isolated ticker pages.",
  },
  {
    title: "Loved entities",
    description:
      "Sign in with Google, heart a company, and persist that preference directly into Firestore under your user profile.",
  },
  {
    title: "Research-ready foundation",
    description:
      "Firestore now powers the first live user-state feature while the platform stays ready for graph intelligence and heavier traversal in Neo4j.",
  },
];

export function HomeExperience() {
  const { configured, loading, signInWithGoogle, signOutUser, user } = useFirebaseAuth();
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [busySymbol, setBusySymbol] = useState<string | null>(null);
  const [lovedCompanies, setLovedCompanies] = useState<LovedEntity[]>([]);

  const services = useMemo(() => getFirebaseServices(), []);

  useEffect(() => {
    if (!configured || !user || !services) {
      setLovedCompanies([]);
      return;
    }

    const lovedCollection = collection(services.db, "users", user.uid, "loved_entities");
    const lovedQuery = query(lovedCollection, orderBy("lovedAt", "desc"));

    const unsubscribe = onSnapshot(lovedQuery, (snapshot) => {
      const nextLovedCompanies = snapshot.docs.map((snapshotDoc) => {
        const data = snapshotDoc.data();
        const lovedAt = data.lovedAt?.toDate?.();

        return {
          symbol: data.symbol as string,
          name: data.name as string,
          sector: data.sector as string,
          thesis: data.thesis as string,
          relationships: data.relationships as string[],
          lovedAtLabel: lovedAt ? lovedAt.toLocaleString() : "Just now",
        } satisfies LovedEntity;
      });

      setLovedCompanies(nextLovedCompanies);
    });

    return () => unsubscribe();
  }, [configured, services, user]);

  const lovedSymbols = useMemo(
    () => new Set(lovedCompanies.map((company) => company.symbol)),
    [lovedCompanies],
  );

  async function handleSignIn() {
    setAuthMessage(null);

    if (!configured) {
      setAuthPromptOpen(true);
      setAuthMessage(
        "Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* variables before using Google sign-in.",
      );
      return;
    }

    try {
      await signInWithGoogle();
      setAuthPromptOpen(false);
    } catch (error) {
      setAuthPromptOpen(true);
      setAuthMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  }

  async function handleToggleLove(company: FeaturedCompany) {
    if (!user || !services) {
      setAuthPromptOpen(true);
      setAuthMessage("Sign in to save loved companies to your Firestore profile.");
      return;
    }

    setBusySymbol(company.symbol);
    setAuthMessage(null);

    try {
      const lovedDoc = doc(services.db, "users", user.uid, "loved_entities", company.symbol);
      const isLoved = lovedSymbols.has(company.symbol);

      if (isLoved) {
        await deleteDoc(lovedDoc);
      } else {
        await setDoc(lovedDoc, {
          entityType: "company",
          symbol: company.symbol,
          name: company.name,
          sector: company.sector,
          thesis: company.thesis,
          relationships: company.relationships,
          lovedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      setAuthPromptOpen(true);
      setAuthMessage(error instanceof Error ? error.message : "Failed to update loved company.");
    } finally {
      startTransition(() => {
        setBusySymbol(null);
      });
    }
  }

  return (
    <main className="relative overflow-hidden bg-[var(--color-ink)] text-[var(--color-paper)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(244,114,182,0.18),_transparent_20%),linear-gradient(180deg,_rgba(9,19,33,0.92),_rgba(7,13,25,1))]" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] opacity-30 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="font-[family:var(--font-sora)] text-lg font-semibold tracking-[0.18em] text-cyan-200 uppercase">
              IFinData
            </p>
            <p className="text-sm text-slate-300">Financial knowledge graph for stock & business research</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-sm text-rose-100">
              Loved entities live MVP
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200">
              {user ? `${lovedCompanies.length} loved` : "Sign in for hearts"}
            </span>
            {user ? (
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                onClick={() => void signOutUser()}
                type="button"
              >
                Sign out {user.displayName?.split(" ")[0] ?? "user"}
              </button>
            ) : (
              <button
                className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                disabled={loading}
                onClick={() => void handleSignIn()}
                type="button"
              >
                {loading ? "Loading auth..." : "Sign in with Google"}
              </button>
            )}
          </div>
        </header>

        <section className="grid flex-1 items-start gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Feature-by-feature shipping loop is ready
            </div>

            <div className="space-y-6">
              <h1 className="max-w-4xl font-[family:var(--font-sora)] text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                See the market as a graph of business models, sectors, and company relationships.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                The first live user feature is here: sign in, heart a public company, and persist that preference to Firestore. This gives the deploy loop something real to validate every time you ship.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-6 py-3 text-base font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
                href="/api/health"
              >
                Open health endpoint
              </a>
              <a
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
                href="#loved-companies"
              >
                Test the loved flow
              </a>
            </div>

            {authPromptOpen ? (
              <div className="rounded-[2rem] border border-amber-200/20 bg-amber-300/10 p-5 text-amber-50" data-testid="auth-prompt">
                <p className="font-[family:var(--font-sora)] text-xl font-semibold">Sign in to save loved companies</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-50/90">
                  {authMessage ??
                    "Use Google sign-in to persist company hearts under users/{uid}/loved_entities in Firestore."}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                    disabled={!configured || loading}
                    onClick={() => void handleSignIn()}
                    type="button"
                  >
                    {configured ? "Continue with Google" : "Firebase setup required"}
                  </button>
                  <button
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white"
                    onClick={() => setAuthPromptOpen(false)}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Scope</p>
                <p className="mt-2 font-[family:var(--font-sora)] text-2xl font-semibold text-white">Public companies first</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Live state</p>
                <p className="mt-2 font-[family:var(--font-sora)] text-2xl font-semibold text-white">Auth + Firestore</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Deploy loop</p>
                <p className="mt-2 font-[family:var(--font-sora)] text-2xl font-semibold text-white">Cloud Run staged</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-300/20 via-blue-500/10 to-rose-400/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Prototype panel</p>
                  <h2 className="mt-2 font-[family:var(--font-sora)] text-2xl font-semibold text-white">Sector cluster canvas</h2>
                </div>
                <button className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-100" type="button">
                  <span aria-hidden="true">♥</span>
                  Loved
                </button>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((sector) => (
                      <span
                        key={sector.name}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${sector.color}`} />
                        {sector.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(11,18,32,0.92))] p-5">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.18),_rgba(15,23,42,0.2)_35%,_rgba(2,6,23,0.94)_80%)]">
                      <div className="graph-ring graph-ring-one" />
                      <div className="graph-ring graph-ring-two" />
                      <div className="graph-ring graph-ring-three" />
                      <div className="graph-node graph-node-core">MSFT</div>
                      <div className="graph-node graph-node-a">NVDA</div>
                      <div className="graph-node graph-node-b">AMZN</div>
                      <div className="graph-node graph-node-c">GOOGL</div>
                      <div className="graph-node graph-node-d">TSM</div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Selected company</p>
                    <h3 className="mt-3 font-[family:var(--font-sora)] text-3xl font-semibold text-white">Microsoft</h3>
                    <p className="mt-2 text-sm text-cyan-200">Technology cluster</p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      Graph detail should explain why the company matters: cloud infrastructure, enterprise software, partner ecosystems, and competitive overlap.
                    </p>

                    <div className="mt-6 space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Business model</p>
                        <p className="mt-2 text-sm text-slate-200">Platform software, cloud services, and AI distribution channel.</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Key edges</p>
                        <p className="mt-2 text-sm text-slate-200">Supplies enterprise stack, partners in cloud, competes in AI infrastructure.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="loved-companies" className="grid gap-6 pb-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Loved companies</p>
                <h2 className="mt-4 font-[family:var(--font-sora)] text-3xl font-semibold text-white">
                  Heart a company and persist it to Firestore.
                </h2>
              </div>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200">
                {configured ? "Firebase ready" : "Firebase config missing"}
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              This is the first deploy-worthy user workflow: unauthenticated users are prompted to sign in, authenticated users can toggle hearts, and the loved collection syncs back from Firestore in real time.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {featuredCompanies.map((company) => {
                const isLoved = lovedSymbols.has(company.symbol);
                const isBusy = busySymbol === company.symbol;

                return (
                  <article
                    key={company.symbol}
                    className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.18em] text-cyan-200">{company.symbol}</p>
                        <h3 className="mt-2 font-[family:var(--font-sora)] text-2xl font-semibold text-white">
                          {company.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-400">{company.sector}</p>
                      </div>
                      <button
                        aria-label={`${isLoved ? "Unlove" : "Love"} ${company.name}`}
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border text-xl transition-transform duration-200 hover:-translate-y-0.5 ${
                          isLoved
                            ? "border-rose-300/40 bg-rose-400/15 text-rose-100"
                            : "border-white/10 bg-white/5 text-white"
                        }`}
                        data-testid={`love-button-${company.symbol.toLowerCase()}`}
                        disabled={isBusy}
                        onClick={() => void handleToggleLove(company)}
                        type="button"
                      >
                        {isBusy ? "…" : "♥"}
                      </button>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-300">{company.thesis}</p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {company.relationships.map((relationship) => (
                        <span
                          key={relationship}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-200"
                        >
                          {relationship}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">My Loved</p>
              <h3 className="mt-3 font-[family:var(--font-sora)] text-2xl font-semibold text-white">
                Firestore-backed user state
              </h3>

              {user ? (
                lovedCompanies.length > 0 ? (
                  <div className="mt-6 grid gap-4">
                    {lovedCompanies.map((company) => (
                      <article
                        key={company.symbol}
                        className="rounded-3xl border border-white/10 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-[family:var(--font-sora)] text-xl font-semibold text-white">
                              {company.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                              {company.symbol} · {company.sector}
                            </p>
                          </div>
                          <span className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-rose-100">
                            loved
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-300">{company.thesis}</p>
                        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">
                          Saved {company.lovedAtLabel}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm leading-7 text-slate-300">
                    You are signed in, but nothing is loved yet. Heart one of the featured companies to confirm Firestore persistence end to end.
                  </p>
                )
              ) : (
                <p className="mt-6 text-sm leading-7 text-slate-300">
                  Sign in to sync loved companies under your profile and validate the first real product-state feature.
                </p>
              )}
            </div>

            <div id="mvp" className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">MVP UI</p>
              <div className="mt-4 grid gap-4">
                {features.map((feature) => (
                  <article key={feature.title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                    <h3 className="font-[family:var(--font-sora)] text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
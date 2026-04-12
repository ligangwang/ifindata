"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name || email || "U").trim();
  if (!source) {
    return "U";
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function SiteNav() {
  const { user, loading, signOut } = useAuth();
  const profileHref = useMemo(() => (user ? `/analysts/${user.uid}` : "/auth"), [user]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="font-[var(--font-sora)] text-lg font-semibold tracking-tight text-cyan-200">
            iFinData
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-200 md:flex">
            <Link href="/predictions" className="hover:text-cyan-200">Feed</Link>
            <Link href="/predictions/new" className="hover:text-cyan-200">Create</Link>
            <Link href="/leaderboard" className="hover:text-cyan-200">Leaderboard</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <span className="text-sm text-slate-400">Loading auth...</span>
          ) : user ? (
            <>
              <Link
                href={profileHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600/25 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/40"
              >
                {initials(user.displayName, user.email)}
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full border border-cyan-400/35 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-500/15"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-full border border-cyan-400/35 px-3 py-1.5 text-sm text-cyan-100 hover:bg-cyan-500/15"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

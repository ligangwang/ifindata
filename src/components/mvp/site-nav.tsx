"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const profileHref = useMemo(() => (user ? `/analysts/${user.uid}` : "/auth"), [user]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
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

          <div className="flex items-center gap-2 sm:gap-3">
            {loading ? (
              <span className="text-sm text-slate-400">Loading auth...</span>
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Open user menu"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-600/25 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/40 transition hover:bg-cyan-500/30"
                >
                  {user.photoURL ? (
                    <span
                      aria-hidden="true"
                      className="h-full w-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${user.photoURL})` }}
                    />
                  ) : (
                    initials(user.displayName, user.email)
                  )}
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur"
                  >
                    <div className="px-3 pb-2 pt-1">
                      <p className="truncate text-sm font-medium text-cyan-100">{user.displayName ?? "Analyst"}</p>
                      <p className="truncate text-xs text-slate-400">{user.email}</p>
                    </div>

                    <Link
                      href={profileHref}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10"
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
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

        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm text-slate-200 md:hidden">
          <Link href="/predictions" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 hover:border-cyan-300/60 hover:text-cyan-200">
            Feed
          </Link>
          <Link href="/predictions/new" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 hover:border-cyan-300/60 hover:text-cyan-200">
            Create
          </Link>
          <Link href="/leaderboard" className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 hover:border-cyan-300/60 hover:text-cyan-200">
            Leaderboard
          </Link>
        </nav>
      </div>
    </header>
  );
}

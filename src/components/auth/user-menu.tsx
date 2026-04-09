"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function UserMenu() {
  const { user, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user.email[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-600 text-sm font-semibold text-white ring-2 ring-transparent transition-all hover:bg-sky-500 focus-visible:ring-sky-400"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={user.name ?? "User"} className="h-full w-full object-cover" src={user.image} />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
            <div className="px-3 py-2">
              {user.name && (
                <p className="truncate text-sm font-medium text-amber-100">{user.name}</p>
              )}
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-slate-800" />
            <button
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-300 transition-colors hover:bg-slate-800"
              onClick={() => {
                setOpen(false);
                void signOutUser();
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

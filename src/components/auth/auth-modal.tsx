"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";

type AuthModalProps = {
  onClose: () => void;
};

type Mode = "signin" | "signup";

function friendlyError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    switch ((err as { code: string }).code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "That email is already in use.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Sign-in was cancelled.";
    }
  }
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, createAccountWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Auto-focus email input when modal opens
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await createAccountWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "signin" ? "Sign in" : "Create account"}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-[family:var(--font-sora)] text-xl font-semibold text-amber-100">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h2>
          <button
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:text-slate-200"
            onClick={onClose}
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M12.78 4.28a.75.75 0 00-1.06-1.06L8 6.94 4.28 3.22a.75.75 0 00-1.06 1.06L6.94 8l-3.72 3.72a.75.75 0 101.06 1.06L8 9.06l3.72 3.72a.75.75 0 001.06-1.06L9.06 8l3.72-3.72z" />
            </svg>
          </button>
        </div>

        {/* Google */}
        <button
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-amber-50 transition-colors hover:bg-slate-800 disabled:opacity-50"
          disabled={submitting}
          onClick={() => void handleGoogle()}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs text-slate-500">or</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>

        {/* Email / password form */}
        <form className="flex flex-col gap-3" onSubmit={(e) => void handleSubmit(e)}>
          <input
            ref={emailRef}
            autoComplete="email"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-amber-50 outline-none placeholder:text-slate-500 transition-colors focus:border-sky-500"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
          <input
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-amber-50 outline-none placeholder:text-slate-500 transition-colors focus:border-sky-500"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />

          {error && (
            <p className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs text-rose-300">{error}</p>
          )}

          <button
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="mt-4 text-center text-xs text-slate-400">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                className="text-sky-400 transition-colors hover:text-sky-300"
                onClick={() => switchMode("signup")}
                type="button"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-sky-400 transition-colors hover:text-sky-300"
                onClick={() => switchMode("signin")}
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

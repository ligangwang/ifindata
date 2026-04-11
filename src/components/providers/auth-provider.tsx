"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFirebaseServices, isFirebaseConfigured } from "@/lib/firebase/client";
import { ensureUserProfileDocument } from "@/lib/firebase/users";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

function toMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const { auth } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (!nextUser) {
        return;
      }

      const { db } = getFirebaseServices();
      void ensureUserProfileDocument(db, nextUser).catch((nextError) => {
        setError(toMessage(nextError, "Unable to create user profile."));
      });
    });

    void setPersistence(auth, browserLocalPersistence).catch((nextError) => {
      setError(toMessage(nextError, "Unable to persist authentication state."));
    });

    return unsubscribe;
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      setError("Firebase is not configured.");
      return;
    }

    setError(null);
    try {
      const { auth, googleProvider } = getFirebaseServices();
      await signInWithPopup(auth, googleProvider);
    } catch (nextError) {
      setError(toMessage(nextError, "Google sign-in failed."));
      throw nextError;
    }
  }, [configured]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        setError("Firebase is not configured.");
        return;
      }

      setError(null);
      try {
        const { auth } = getFirebaseServices();
        await signInWithEmailAndPassword(auth, email, password);
      } catch (nextError) {
        setError(toMessage(nextError, "Email sign-in failed."));
        throw nextError;
      }
    },
    [configured],
  );

  const createAccountWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        setError("Firebase is not configured.");
        return;
      }

      setError(null);
      try {
        const { auth } = getFirebaseServices();
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (nextError) {
        setError(toMessage(nextError, "Email account creation failed."));
        throw nextError;
      }
    },
    [configured],
  );

  const signOut = useCallback(async () => {
    if (!configured) {
      setUser(null);
      return;
    }

    setError(null);
    try {
      const { auth } = getFirebaseServices();
      await firebaseSignOut(auth);
      setUser(null);
    } catch (nextError) {
      setError(toMessage(nextError, "Sign-out failed."));
      throw nextError;
    }
  }, [configured]);

  const getIdToken = useCallback(async () => {
    if (!user) {
      return null;
    }
    return user.getIdToken();
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      error,
      signInWithGoogle,
      signInWithEmail,
      createAccountWithEmail,
      signOut,
      getIdToken,
    }),
    [
      user,
      loading,
      configured,
      error,
      signInWithGoogle,
      signInWithEmail,
      createAccountWithEmail,
      signOut,
      getIdToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

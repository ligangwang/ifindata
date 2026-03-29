"use client";

import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseServices } from "@/lib/firebase/client";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

type FirebaseAuthProviderProps = {
  children: React.ReactNode;
};

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const services = useMemo(() => getFirebaseServices(), []);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => services !== null);

  useEffect(() => {
    if (!services) {
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    void services.persistenceReady
      .catch(() => undefined)
      .then(() => {
        if (!isMounted) {
          return;
        }

        unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        });
      });

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [services]);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      user,
      loading,
      configured: services !== null,
      signInWithGoogle: async () => {
        if (!services) {
          throw new Error("Firebase is not configured.");
        }

        await services.persistenceReady;
        await signInWithPopup(services.auth, services.googleProvider);
      },
      signOutUser: async () => {
        if (!services) {
          return;
        }

        await signOut(services.auth);
      },
    }),
    [loading, services, user],
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider.");
  }

  return context;
}
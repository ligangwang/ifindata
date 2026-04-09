"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isFirebaseConfigured, getFirebaseServices } from "@/lib/firebase/client";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

type AuthContextValue = {
  user: { id: string; email: string; name?: string; image?: string } | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccountWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // Start loading=true only when Firebase is configured (waiting for auth state);
  // otherwise auth is immediately settled as unauthenticated.
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured());
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const { auth } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [configured]);

  const handleSignIn = async () => {
    const { auth, googleProvider } = getFirebaseServices();
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignInWithEmail = async (email: string, password: string) => {
    const { auth } = getFirebaseServices();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleCreateAccount = async (email: string, password: string) => {
    const { auth } = getFirebaseServices();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const handleSignOut = async () => {
    const { auth } = getFirebaseServices();
    await signOut(auth);
  };

  const value: AuthContextValue = {
    user: user
      ? {
          id: user.uid,
          email: user.email ?? "",
          name: user.displayName ?? undefined,
          image: user.photoURL ?? undefined,
        }
      : null,
    loading,
    configured,
    signInWithGoogle: handleSignIn,
    signInWithEmail: handleSignInWithEmail,
    createAccountWithEmail: handleCreateAccount,
    signOutUser: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

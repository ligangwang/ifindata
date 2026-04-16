"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
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

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<AuthActionResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  createAccountWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthActionResult = {
  user: User;
  shouldCompleteProfile: boolean;
};

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

  const bootstrapUserProfile = useCallback(async (nextUser: User) => {
    const token = await nextUser.getIdToken();
    const response = await fetch("/api/users/bootstrap", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: nextUser.displayName,
        email: nextUser.email,
        photoURL: nextUser.photoURL,
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to create user profile.");
    }

    return (await response.json()) as { created: boolean };
  }, []);

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

      void bootstrapUserProfile(nextUser).catch((nextError) => {
        setError(toMessage(nextError, "Unable to create user profile."));
      });
    });

    void setPersistence(auth, browserLocalPersistence).catch((nextError) => {
      setError(toMessage(nextError, "Unable to persist authentication state."));
    });

    return unsubscribe;
  }, [bootstrapUserProfile, configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      const nextError = new Error("Firebase is not configured.");
      setError(nextError.message);
      throw nextError;
    }

    setError(null);
    try {
      const { auth, googleProvider } = getFirebaseServices();
      const credential = await signInWithPopup(auth, googleProvider);
      const additionalUserInfo = getAdditionalUserInfo(credential);
      await bootstrapUserProfile(credential.user);

      return {
        user: credential.user,
        shouldCompleteProfile: additionalUserInfo?.isNewUser ?? false,
      };
    } catch (nextError) {
      setError(toMessage(nextError, "Google sign-in failed."));
      throw nextError;
    }
  }, [bootstrapUserProfile, configured]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        const nextError = new Error("Firebase is not configured.");
        setError(nextError.message);
        throw nextError;
      }

      setError(null);
      try {
        const { auth } = getFirebaseServices();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await bootstrapUserProfile(credential.user);

        return {
          user: credential.user,
          shouldCompleteProfile: false,
        };
      } catch (nextError) {
        setError(toMessage(nextError, "Email sign-in failed."));
        throw nextError;
      }
    },
    [bootstrapUserProfile, configured],
  );

  const createAccountWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!configured) {
        const nextError = new Error("Firebase is not configured.");
        setError(nextError.message);
        throw nextError;
      }

      setError(null);
      try {
        const { auth } = getFirebaseServices();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await bootstrapUserProfile(credential.user);

        return {
          user: credential.user,
          shouldCompleteProfile: true,
        };
      } catch (nextError) {
        setError(toMessage(nextError, "Email account creation failed."));
        throw nextError;
      }
    },
    [bootstrapUserProfile, configured],
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

  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (!user) {
      return null;
    }
    return user.getIdToken(forceRefresh);
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

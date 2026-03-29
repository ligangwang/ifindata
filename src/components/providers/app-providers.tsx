"use client";

import { FirebaseAuthProvider } from "@/components/providers/firebase-auth-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
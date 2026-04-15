import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";

function isAdminValue(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "admin";
}

export function hasAdminRole(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) {
    return false;
  }

  if (data.admin === true || data.isAdmin === true) {
    return true;
  }

  if (isAdminValue(data.role)) {
    return true;
  }

  if (Array.isArray(data.roles)) {
    return data.roles.some(isAdminValue);
  }

  return false;
}

export async function isAdminUser(decoded: DecodedIdToken): Promise<boolean> {
  if (hasAdminRole(decoded)) {
    return true;
  }

  const userSnapshot = await getAdminFirestore().collection("users").doc(decoded.uid).get();
  return userSnapshot.exists && hasAdminRole(userSnapshot.data());
}

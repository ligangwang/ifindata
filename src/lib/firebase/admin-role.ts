import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";

export type AdminRoleStatus = {
  isAdmin: boolean;
  claimRole: string | null;
  claimAdmin: boolean;
  claimIsAdmin: boolean;
  firestoreRole: string | null;
  firestoreRoles: string[];
  firestoreAdmin: boolean;
  firestoreIsAdmin: boolean;
  firestoreUserExists: boolean;
};

function isAdminValue(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "admin";
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
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
  const status = await resolveAdminRoleStatus(decoded);
  return status.isAdmin;
}

export async function resolveAdminRoleStatus(decoded: DecodedIdToken): Promise<AdminRoleStatus> {
  const claimAdmin = decoded.admin === true;
  const claimIsAdmin = decoded.isAdmin === true;
  const claimRole = readString(decoded.role);
  const claimHasAdminRole = hasAdminRole(decoded);

  const userSnapshot = await getAdminFirestore().collection("users").doc(decoded.uid).get();
  const firestoreData = userSnapshot.data();
  const firestoreRole = readString(firestoreData?.role);
  const firestoreRoles = readStringArray(firestoreData?.roles);
  const firestoreAdmin = firestoreData?.admin === true;
  const firestoreIsAdmin = firestoreData?.isAdmin === true;
  const firestoreHasAdminRole = hasAdminRole(firestoreData);

  return {
    isAdmin: claimHasAdminRole || firestoreHasAdminRole,
    claimRole,
    claimAdmin,
    claimIsAdmin,
    firestoreRole,
    firestoreRoles,
    firestoreAdmin,
    firestoreIsAdmin,
    firestoreUserExists: userSnapshot.exists,
  };
}

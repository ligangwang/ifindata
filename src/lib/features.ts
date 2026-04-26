export type AppFeatures = {
  proFeaturesEnabled: boolean;
  billingEnabled: boolean;
  proBillingBypass: boolean;
  canUsePro: boolean;
};

export type UserPlan = "FREE" | "PRO";

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getAppFeatures(): AppFeatures {
  return {
    proFeaturesEnabled: envFlag("ENABLE_PRO_FEATURES"),
    billingEnabled: envFlag("ENABLE_BILLING"),
    proBillingBypass: envFlag("PRO_BILLING_BYPASS"),
    canUsePro: false,
  };
}

export function areProFeaturesEnabled(): boolean {
  return getAppFeatures().proFeaturesEnabled;
}

export function readUserPlan(data: Record<string, unknown> | undefined): UserPlan {
  const billing = data?.billing;
  if (billing && typeof billing === "object") {
    const plan = (billing as Record<string, unknown>).plan;
    if (plan === "PRO") {
      return "PRO";
    }
  }

  return "FREE";
}

export function canUseProFeaturesForUserData(data: Record<string, unknown> | undefined): boolean {
  const features = getAppFeatures();
  if (!features.proFeaturesEnabled) {
    return false;
  }

  if (features.proBillingBypass) {
    return true;
  }

  return readUserPlan(data) === "PRO";
}

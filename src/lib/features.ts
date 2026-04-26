export type AppFeatures = {
  proFeaturesEnabled: boolean;
  billingEnabled: boolean;
};

function envFlag(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function getAppFeatures(): AppFeatures {
  return {
    proFeaturesEnabled: envFlag("ENABLE_PRO_FEATURES"),
    billingEnabled: envFlag("ENABLE_BILLING"),
  };
}

export function areProFeaturesEnabled(): boolean {
  return getAppFeatures().proFeaturesEnabled;
}

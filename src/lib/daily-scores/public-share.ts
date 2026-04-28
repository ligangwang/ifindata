const DAILY_SHARE_CARD_VERSION = "v1";

export function dailyCanonicalPath(date: string | null): string {
  return date ? `/daily?date=${encodeURIComponent(date)}` : "/daily";
}

export function dailyShareImageDate(date: string | null): string {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "latest";
}

export function dailyShareVersion(date: string | null): string {
  return `${DAILY_SHARE_CARD_VERSION}-${dailyShareImageDate(date)}`;
}

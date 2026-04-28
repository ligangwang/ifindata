import { ImageResponse } from "next/og";
import { getDailyScores, type DailyCallHighlight } from "@/lib/daily-scores/service";
import { normalizeTicker } from "@/lib/predictions/types";

export const dailyShareCardSize = {
  width: 1200,
  height: 630,
};

export const dailyShareCardContentType = "image/png";

function Brand() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, color: "#f8fafc" }}>
        You<span style={{ color: "#22c55e" }}>Analyst</span>
      </div>
      <div style={{ color: "#94a3b8", display: "flex", fontSize: 18, marginTop: 8 }}>
        Your watchlist. Your track record.
      </div>
    </div>
  );
}

function dateLabel(value: string | null): string {
  if (!value) {
    return "Latest daily update";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function directionArrow(direction: "UP" | "DOWN" | null): string {
  if (direction === "UP") {
    return "UP";
  }
  if (direction === "DOWN") {
    return "DOWN";
  }
  return "";
}

function tickerText(call: DailyCallHighlight): string {
  const ticker = call.ticker ? normalizeTicker(call.ticker) : "";
  return ticker ? `$${ticker}` : "Unknown ticker";
}

function userName(call: DailyCallHighlight): string {
  return call.nickname ? `@${call.nickname}` : call.displayName ?? "Anonymous";
}

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)}`;
}

function dailyReturnText(value: number | null): string {
  if (value === null) {
    return "Missing daily data";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function returnToneColor(value: number | null): string {
  if (value === null) {
    return "#cbd5e1";
  }
  if (value > 0) {
    return "#6ee7b7";
  }
  if (value < 0) {
    return "#fda4af";
  }
  return "#cbd5e1";
}

function fallbackImage() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#020617",
        color: "#e0f2fe",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Brand />
      <div style={{ color: "#94a3b8", display: "flex", fontSize: 30, marginTop: 28 }}>
        Daily highlights unavailable
      </div>
    </div>
  );
}

function shareCardImage(date: string | null, topCalls: DailyCallHighlight[]) {
  const callOfTheDay = topCalls[0] ?? null;
  const listCalls = topCalls.slice(0, 4);

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "#020617",
        color: "#e0f2fe",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "flex-start",
        padding: "52px 64px",
        width: "100%",
      }}
    >
      <Brand />
      <div style={{ color: "#38bdf8", display: "flex", fontSize: 26, fontWeight: 700, marginTop: 60 }}>
        {dateLabel(date)}
      </div>
      <div style={{ color: "#f8fafc", display: "flex", fontSize: 56, fontWeight: 800, marginTop: 14 }}>
        Best Calls Today
      </div>
      {callOfTheDay ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, width: "100%" }}>
          <div style={{ alignItems: "baseline", display: "flex", gap: 18 }}>
            <div style={{ color: "#bae6fd", display: "flex", fontSize: 36, fontWeight: 800 }}>
              {directionArrow(callOfTheDay.direction)} {tickerText(callOfTheDay)}
            </div>
            <div style={{ color: returnToneColor(callOfTheDay.dailyReturnChange), display: "flex", fontSize: 40, fontWeight: 800 }}>
              {dailyReturnText(callOfTheDay.dailyReturnChange)}
            </div>
            <div style={{ color: "#94a3b8", display: "flex", fontSize: 24 }}>
              {scoreText(callOfTheDay.dailyScoreChange)} score today
            </div>
          </div>
          <div style={{ color: "#cbd5e1", display: "flex", fontSize: 24, marginTop: 8 }}>
            Call of the day by {userName(callOfTheDay)}
          </div>
        </div>
      ) : (
        <div style={{ color: "#cbd5e1", display: "flex", fontSize: 30, marginTop: 40 }}>
          No daily highlights yet.
        </div>
      )}
      {listCalls.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 30, width: "100%" }}>
          {listCalls.map((call, index) => (
            <div
              key={call.predictionId}
              style={{
                alignItems: "center",
                borderColor: "rgba(148, 163, 184, 0.22)",
                borderRadius: 14,
                borderStyle: "solid",
                borderWidth: 1,
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 18px",
                width: "100%",
              }}
            >
              <div style={{ alignItems: "baseline", display: "flex", gap: 14 }}>
                <div style={{ color: "#67e8f9", display: "flex", fontSize: 24, fontWeight: 800 }}>
                  #{index + 1}
                </div>
                <div style={{ color: "#bae6fd", display: "flex", fontSize: 26, fontWeight: 800 }}>
                  {directionArrow(call.direction)} {tickerText(call)}
                </div>
                <div style={{ color: "#e2e8f0", display: "flex", fontSize: 22 }}>
                  {userName(call)}
                </div>
              </div>
              <div style={{ alignItems: "baseline", display: "flex", gap: 12 }}>
                <div style={{ color: returnToneColor(call.dailyReturnChange), display: "flex", fontSize: 26, fontWeight: 800 }}>
                  {dailyReturnText(call.dailyReturnChange)}
                </div>
                <div style={{ color: "#94a3b8", display: "flex", fontSize: 20 }}>
                  {scoreText(call.dailyScoreChange)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export async function createDailyShareImage(date: string | null): Promise<ImageResponse> {
  try {
    const result = await getDailyScores(date);
    return new ImageResponse(
      result.topCalls.length > 0 ? shareCardImage(result.date, result.topCalls) : fallbackImage(),
      dailyShareCardSize,
    );
  } catch {
    return new ImageResponse(fallbackImage(), dailyShareCardSize);
  }
}

export function getAiAnalystUserId(): string {
  const userId = process.env.AI_ANALYST_USER_ID?.trim();

  if (!userId) {
    throw new Error("Missing AI_ANALYST_USER_ID");
  }

  return userId;
}

export function getOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return apiKey;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-5.4";
}


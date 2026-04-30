const X_POST_INTENT_URL = "https://x.com/intent/post";

export function xPostIntentUrl({
  text,
  url,
}: {
  text: string;
  url: string;
}): string {
  const postText = `${text.trim()}\n\n${url}`.trim();
  const params = new URLSearchParams({ text: postText });

  return `${X_POST_INTENT_URL}?${params.toString()}`;
}

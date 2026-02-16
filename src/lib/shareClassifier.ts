export type PrefillMode = "sms" | "email" | "url";

export type PrefillPayload =
  | { mode: "sms"; text: string }
  | { mode: "email"; body: string }
  | { mode: "url"; url: string };

function looksLikeUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim()) || /\bhttps?:\/\//i.test(s);
}

function extractFirstUrl(s: string): string | null {
  const m = s.match(/https?:\/\/[^\s)\]}>'\"]+/i);
  return m ? m[0] : null;
}

function looksLikeEmailContent(s: string): boolean {
  const t = s.toLowerCase();
  return t.includes("subject:") && (t.includes("from:") || t.includes("to:"));
}

// expo-share-intent shape varies by platform/version. Keep it loose.
export function classifyShareIntent(shareIntent: any): PrefillPayload | null {
  if (!shareIntent) return null;

  // Some versions expose shareIntent.webUrl (already parsed).
  if (typeof shareIntent.webUrl === "string" && shareIntent.webUrl.trim()) {
    return { mode: "url", url: shareIntent.webUrl.trim() };
  }

  const text = typeof shareIntent.text === "string" ? shareIntent.text.trim() : "";
  if (!text) return null;

  // If the shared text contains a URL, prefer URL mode.
  if (looksLikeUrl(text)) {
    const u = extractFirstUrl(text);
    if (u) return { mode: "url", url: u };
  }

  // If it looks like an email (Subject/From), route to email mode.
  if (looksLikeEmailContent(text)) {
    return { mode: "email", body: text };
  }

  // Default to SMS/text mode.
  return { mode: "sms", text };
}

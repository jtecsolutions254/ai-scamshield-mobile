import * as Clipboard from "expo-clipboard";

export function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)\]}>'\"]+/i);
  return m ? m[0] : null;
}

export async function getClipboardText(): Promise<string> {
  try {
    const has = await Clipboard.hasStringAsync();
    if (!has) return "";
    return (await Clipboard.getStringAsync()) || "";
  } catch {
    return "";
  }
}

export async function getClipboardUrl(): Promise<string | null> {
  const t = await getClipboardText();
  if (!t) return null;
  return extractFirstUrl(t);
}

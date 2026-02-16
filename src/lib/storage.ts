import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppSettings = {
  autoAnalyzeShared: boolean;
  watchClipboard: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  autoAnalyzeShared: true,
  watchClipboard: true,
};

const KEYS = {
  settings: "scamshield.settings.v1",
  gmailToken: "scamshield.gmail.token.v1",
  gmailTokenExp: "scamshield.gmail.tokenexp.v1",
  gmailLastScan: "scamshield.gmail.lastscan.v1",
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(next));
  return next;
}

export async function saveGmailAccessToken(token: string, expiresAtMs: number) {
  await AsyncStorage.setItem(KEYS.gmailToken, token);
  await AsyncStorage.setItem(KEYS.gmailTokenExp, String(expiresAtMs));
}

export async function getGmailAccessToken(): Promise<{ token: string; expiresAtMs: number } | null> {
  const token = await AsyncStorage.getItem(KEYS.gmailToken);
  const exp = await AsyncStorage.getItem(KEYS.gmailTokenExp);
  if (!token || !exp) return null;
  const expiresAtMs = Number(exp);
  if (!Number.isFinite(expiresAtMs)) return null;
  return { token, expiresAtMs };
}

export async function clearGmailAccessToken() {
  await AsyncStorage.removeItem(KEYS.gmailToken);
  await AsyncStorage.removeItem(KEYS.gmailTokenExp);
}

export async function getGmailLastScanMs(): Promise<number> {
  const v = await AsyncStorage.getItem(KEYS.gmailLastScan);
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function setGmailLastScanMs(ms: number) {
  await AsyncStorage.setItem(KEYS.gmailLastScan, String(ms));
}

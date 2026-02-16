import { postJSON } from "./api";
import { gmailGetMessage, gmailListMessages, gmailToAnalyzeBody } from "./gmail";
import { getGmailLastScanMs, setGmailLastScanMs } from "./storage";

export type AnalyzeResponse = {
  type: string;
  risk_score: number;
  risk_level: string;
  ml: { prob_phish: number; confidence: number; model_version: string };
  reasons: string[];
  recommended_actions: string[];
  analysis_id: string;
};

export async function scanLatestGmail(token: string, maxEmails = 5): Promise<{ scanned: number; flagged: number }>{
  const lastScan = await getGmailLastScanMs();
  // Gmail query: only scan recent mail (and reduce duplicates)
  // If you want stricter: store processed IDs.
  const q = lastScan ? "newer_than:1d" : "newer_than:7d";

  const list = await gmailListMessages(token, maxEmails, q);
  const ids = (list.messages || []).map((m) => m.id);

  let scanned = 0;
  let flagged = 0;

  for (const id of ids) {
    const msg = await gmailGetMessage(token, id);
    const body = gmailToAnalyzeBody(msg);
    if (!body) continue;

    const res = await postJSON<AnalyzeResponse>("/api/v1/analyze-email", { body });
    scanned += 1;
    if (res.risk_level?.toLowerCase() === "high" || res.risk_score >= 70) flagged += 1;
  }

  await setGmailLastScanMs(Date.now());
  return { scanned, flagged };
}

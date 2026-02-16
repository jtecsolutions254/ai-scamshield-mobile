export type GmailMessageList = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailMessage = {
  id: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
};

function header(msg: GmailMessage, name: string): string {
  const headers = msg.payload?.headers || [];
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || "";
}

export async function gmailListMessages(token: string, maxResults = 10, q?: string): Promise<GmailMessageList> {
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${encodeURIComponent(String(maxResults))}`;
  if (q) url += `&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail list failed: HTTP ${res.status}`);
  return res.json();
}

export async function gmailGetMessage(token: string, id: string): Promise<GmailMessage> {
  // metadata format is enough for scam analysis (subject/from/date + snippet)
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail get failed: HTTP ${res.status}`);
  return res.json();
}

export function gmailToAnalyzeBody(msg: GmailMessage): string {
  const subject = header(msg, "Subject");
  const from = header(msg, "From");
  const to = header(msg, "To");
  const date = header(msg, "Date");

  const text = msg.snippet || "";
  const lines = [
    subject ? `Subject: ${subject}` : "",
    from ? `From: ${from}` : "",
    to ? `To: ${to}` : "",
    date ? `Date: ${date}` : "",
    "",
    text,
  ].filter(Boolean);

  return lines.join("\n");
}

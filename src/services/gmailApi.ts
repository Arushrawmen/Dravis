/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Gmail REST API Client Service (gmail.googleapis.com)
 */

import { getAccessToken } from "./googleAuth";

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: {
    size: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

export interface GmailMessageRaw {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: GmailMessagePart;
  sizeEstimate: number;
}

export interface ParsedEmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  date: string;
  dateTimestamp: number;
  snippet: string;
  bodyHtml: string;
  bodyText: string;
  labelIds: string[];
  isStarred: boolean;
  isUnread: boolean;
  isTrash: boolean;
  isDraft: boolean;
  isSent: boolean;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type: "system" | "user";
  messagesTotal?: number;
  messagesUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

const GMAIL_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

// Helper to decode base64url encoded strings
function decodeBase64Url(input?: string): string {
  if (!input) return "";
  try {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const decoded = atob(base64);
    // Decode UTF-8 bytes cleanly
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    console.warn("Base64Url decode fallback:", e);
    return "";
  }
}

// Helper to encode string to RFC 2822 base64url for sending
function encodeBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Recursively extract HTML and text from message payload parts
function extractBodyContent(part: GmailMessagePart): { html: string; text: string } {
  let html = "";
  let text = "";

  if (part.mimeType === "text/html" && part.body?.data) {
    html = decodeBase64Url(part.body.data);
  } else if (part.mimeType === "text/plain" && part.body?.data) {
    text = decodeBase64Url(part.body.data);
  }

  if (part.parts && part.parts.length > 0) {
    for (const subPart of part.parts) {
      const sub = extractBodyContent(subPart);
      if (sub.html && !html) html = sub.html;
      if (sub.text && !text) text = sub.text;
    }
  }

  return { html, text };
}

// Parse sender name & email from "Name <email@domain>" format
function parseSender(fromHeader: string): { name: string; email: string } {
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, "").trim() || match[2],
      email: match[2].trim(),
    };
  }
  return { name: fromHeader, email: fromHeader };
}

// Format raw Gmail message into rich typed ParsedEmailMessage
export function parseGmailMessage(msg: GmailMessageRaw): ParsedEmailMessage {
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const subject = getHeader("Subject") || "(No Subject)";
  const from = getHeader("From") || "Unknown Sender";
  const { name: fromName, email: fromEmail } = parseSender(from);
  const to = getHeader("To") || "";
  const dateStr = getHeader("Date") || "";
  const dateTimestamp = dateStr ? new Date(dateStr).getTime() : parseInt(msg.internalDate, 10) || Date.now();
  const labelIds = msg.labelIds || [];

  const { html, text } = extractBodyContent(msg.payload);

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject,
    from,
    fromName,
    fromEmail,
    to,
    date: dateStr,
    dateTimestamp,
    snippet: msg.snippet || "",
    bodyHtml: html,
    bodyText: text || msg.snippet || "",
    labelIds,
    isStarred: labelIds.includes("STARRED"),
    isUnread: labelIds.includes("UNREAD"),
    isTrash: labelIds.includes("TRASH"),
    isDraft: labelIds.includes("DRAFT"),
    isSent: labelIds.includes("SENT"),
  };
}

export class GmailApiClient {
  private async getAuthHeader(): Promise<{ Authorization: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("Authentication required. Please sign in with Google to access your Gmail.");
    }
    return { Authorization: `Bearer ${token}` };
  }

  // 1. Get User Profile
  public async getProfile(): Promise<GmailProfile> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/profile`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Gmail profile: ${res.statusText}`);
    }
    return res.json();
  }

  // 2. List Labels
  public async listLabels(): Promise<GmailLabel[]> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/labels`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch Gmail labels: ${res.statusText}`);
    }
    const data = await res.json();
    return data.labels || [];
  }

  // 3. List Messages
  public async listMessages(options?: {
    q?: string;
    maxResults?: number;
    pageToken?: string;
    labelIds?: string[];
  }): Promise<{ messages: { id: string; threadId: string }[]; nextPageToken?: string; resultSizeEstimate?: number }> {
    const headers = await this.getAuthHeader();
    const params = new URLSearchParams();
    if (options?.q) params.set("q", options.q);
    if (options?.maxResults) params.set("maxResults", String(options.maxResults));
    if (options?.pageToken) params.set("pageToken", options.pageToken);
    if (options?.labelIds && options.labelIds.length > 0) {
      options.labelIds.forEach((lid) => params.append("labelIds", lid));
    }

    const url = `${GMAIL_BASE_URL}/messages?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch messages: ${res.statusText}`);
    }
    return res.json();
  }

  // 4. Get Single Message Details
  public async getMessage(id: string, format: "full" | "metadata" | "minimal" = "full"): Promise<GmailMessageRaw> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/messages/${id}?format=${format}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch message ${id}: ${res.statusText}`);
    }
    return res.json();
  }

  // 5. Batch Fetch Full Messages
  public async fetchMessagesBatch(messageStubs: { id: string }[]): Promise<ParsedEmailMessage[]> {
    if (!messageStubs || messageStubs.length === 0) return [];
    // Fetch in parallel with limit of 15
    const batch = messageStubs.slice(0, 15);
    const results = await Promise.allSettled(batch.map((m) => this.getMessage(m.id)));
    const parsed: ParsedEmailMessage[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") {
        parsed.push(parseGmailMessage(r.value));
      }
    });
    return parsed;
  }

  // 6. Send Email (Requires user confirmation before execution)
  public async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
    replyToMessageId?: string;
    threadId?: string;
  }): Promise<{ id: string; threadId: string; labelIds: string[] }> {
    const headers = await this.getAuthHeader();

    // Construct standard RFC 2822 email format
    const lines = [
      `To: ${params.to}`,
      params.cc ? `Cc: ${params.cc}` : null,
      params.bcc ? `Bcc: ${params.bcc}` : null,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      params.body,
    ]
      .filter((l) => l !== null)
      .join("\r\n");

    const raw = encodeBase64Url(lines);
    const payload: any = { raw };
    if (params.threadId) {
      payload.threadId = params.threadId;
    }

    const res = await fetch(`${GMAIL_BASE_URL}/messages/send`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to send email: ${res.statusText}`);
    }
    return res.json();
  }

  // 7. Create Draft
  public async createDraft(params: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ id: string; message: GmailMessageRaw }> {
    const headers = await this.getAuthHeader();

    const lines = [
      `To: ${params.to}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      params.body,
    ].join("\r\n");

    const raw = encodeBase64Url(lines);

    const res = await fetch(`${GMAIL_BASE_URL}/drafts`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: { raw } }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create draft: ${res.statusText}`);
    }
    return res.json();
  }

  // 8. Modify Labels (Star, Unread, Custom)
  public async modifyMessageLabels(
    id: string,
    addLabelIds: string[] = [],
    removeLabelIds: string[] = []
  ): Promise<GmailMessageRaw> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/messages/${id}/modify`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to modify labels: ${res.statusText}`);
    }
    return res.json();
  }

  // 9. Move to Trash (Requires confirmation)
  public async trashMessage(id: string): Promise<GmailMessageRaw> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/messages/${id}/trash`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to trash message: ${res.statusText}`);
    }
    return res.json();
  }

  // 10. Permanently Delete Message (Destructive - Requires confirmation)
  public async deleteMessage(id: string): Promise<void> {
    const headers = await this.getAuthHeader();
    const res = await fetch(`${GMAIL_BASE_URL}/messages/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to delete message: ${res.statusText}`);
    }
  }
}

export const gmailApi = new GmailApiClient();

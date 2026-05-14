import { google } from "googleapis";

// You will need to add these to your .env file
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

if (REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

export const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

export async function fetchUnreadEmails(query: string = "is:unread from:google.com") {
  if (!REFRESH_TOKEN) {
    console.warn("Gmail API not configured. Missing REFRESH_TOKEN.");
    return [];
  }

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 20,
  });

  const messages = res.data.messages || [];
  const fullMessages = [];

  for (const message of messages) {
    if (!message.id) continue;
    const msgData = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });
    fullMessages.push(msgData.data);
  }

  return fullMessages;
}

export async function markEmailAsRead(messageId: string) {
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

/**
 * Send an email via Gmail API.
 * Supports threaded replies via optional threadId.
 */
export async function sendEmail({
  to,
  subject,
  body,
  threadId,
  inReplyTo,
}: {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!REFRESH_TOKEN) {
    console.error("Gmail API not configured. Missing REFRESH_TOKEN. Cannot send email.");
    return { success: false, error: "Gmail not configured — missing REFRESH_TOKEN" };
  }

  try {
    // Build RFC 2822 email
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
    ];

    if (inReplyTo) {
      headers.push(`In-Reply-To: ${inReplyTo}`);
      headers.push(`References: ${inReplyTo}`);
    }

    const rawEmail = `${headers.join("\r\n")}\r\n\r\n${body}`;

    // Base64url encode
    const encodedMessage = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendParams: any = {
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    };

    // Thread the reply if we have a threadId
    if (threadId) {
      sendParams.requestBody.threadId = threadId;
    }

    const result = await gmail.users.messages.send(sendParams);

    console.log(`Email sent successfully. Message ID: ${result.data.id}`);
    return { success: true, messageId: result.data.id || undefined };
  } catch (error) {
    console.error("Gmail sendEmail Error:", error);
    const err = error as Error;
    return { success: false, error: err.message || "Unknown send error" };
  }
}

/**
 * Check if Gmail OAuth is configured and the token is valid.
 */
export async function checkGmailHealth(): Promise<{ configured: boolean; valid: boolean; error?: string }> {
  if (!REFRESH_TOKEN) {
    return { configured: false, valid: false, error: "Missing GMAIL_REFRESH_TOKEN" };
  }

  try {
    // Try to list labels — lightweight API call to verify token
    await gmail.users.labels.list({ userId: "me" });
    return { configured: true, valid: true };
  } catch (error) {
    const err = error as Error;
    return { configured: true, valid: false, error: err.message };
  }
}


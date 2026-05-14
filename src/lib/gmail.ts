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

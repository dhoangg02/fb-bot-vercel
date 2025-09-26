import { buildDependencies, processMessagingEvent } from "../lib/messageProcessor.js";
import { createSmartReplyGenerator } from "../lib/openAIResponder.js";
import { createSheetsLogger } from "../lib/googleSheetsLogger.js";
import { createFacebookSender } from "../lib/facebookMessenger.js";
import { withTimeout } from "../lib/withTimeout.js";

const DEFAULT_TIMEOUT_MS = 8000;

function createDependenciesFromEnv() {
  const sendTextMessage = createFacebookSender({
    pageToken: process.env.FB_PAGE_ACCESS_TOKEN,
    graphVersion: process.env.FB_GRAPH_VERSION,
  });

  const generateSmartReply = createSmartReplyGenerator({
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
  });

  const logMessage = createSheetsLogger({
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    worksheetName: process.env.GOOGLE_SHEETS_WORKSHEET_NAME,
  });

  return buildDependencies({
    sendTextMessage,
    generateSmartReply,
    logMessage,
    fallbackMessage: process.env.DEFAULT_FALLBACK_MESSAGE || "Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất.",
  });
}

async function handleEvents(entries, deps) {
  const tasks = [];

  for (const entry of entries) {
    const events = entry.messaging || [];
    for (const event of events) {
      tasks.push(
        withTimeout(
          processMessagingEvent(event, deps),
          DEFAULT_TIMEOUT_MS,
          () => console.warn("Processing event timed out", { sender: event?.sender?.id })
        ).catch((err) => {
          console.error("Process message error", err);
        })
      );
    }
  }

  await Promise.allSettled(tasks);
}

export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const entries = body.entry || [];

      if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(200).send("EVENT_RECEIVED");
      }

      const deps = createDependenciesFromEnv();
      await handleEvents(entries, deps);

      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(200).send("OK");
    }
  }

  return res.status(405).send("Method Not Allowed");
}


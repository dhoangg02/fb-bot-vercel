import { google } from "googleapis";

function normalizePrivateKey(key) {
  return key?.replace(/\\n/g, "\n");
}

export function createSheetsLogger({
  clientEmail,
  privateKey,
  spreadsheetId,
  worksheetName = "Sheet1",
} = {}) {
  if (!clientEmail || !privateKey || !spreadsheetId) {
    return async () => false;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: normalizePrivateKey(privateKey),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  return async function logMessage({ timestamp, senderId, text, hasAttachments, reply }) {
    const values = [[
      timestamp,
      senderId || "",
      text || (hasAttachments ? "[Attachments]" : ""),
      hasAttachments ? "Yes" : "No",
      reply || "",
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${worksheetName}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return true;
  };
}


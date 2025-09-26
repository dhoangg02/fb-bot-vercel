const DEFAULT_GRAPH_VERSION = "v21.0";

export function createFacebookSender({ pageToken, graphVersion = DEFAULT_GRAPH_VERSION } = {}) {
  if (!pageToken) {
    return async () => {
      throw new Error("Missing Facebook PAGE access token");
    };
  }

  const baseUrl = `https://graph.facebook.com/${graphVersion}/me/messages?access_token=${encodeURIComponent(pageToken)}`;

  return async function sendTextMessage(recipientId, text) {
    if (!recipientId || !text) {
      return;
    }

    await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
  };
}


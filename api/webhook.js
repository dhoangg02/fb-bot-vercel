// api/webhook.js
// Vercel Serverless Function (Node 18+). Dùng cho Facebook Messenger Webhook.

export default async function handler(req, res) {
  const VERIFY_TOKEN  = process.env.FB_VERIFY_TOKEN;         // bạn tự đặt
  const PAGE_TOKEN    = process.env.FB_PAGE_ACCESS_TOKEN || ""; // token của Page
  const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || "v21.0";

  // 1) VERIFY: Facebook gọi GET để xác minh webhook
  if (req.method === "GET") {
    const mode      = req.query["hub.mode"];
    const token     = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Forbidden");
  }

  // 2) EVENTS: Facebook đẩy POST khi có tin nhắn vào Page
  if (req.method === "POST") {
    try {
      const body    = req.body || {};
      const entries = body.entry || [];

      for (const entry of entries) {
        const events = entry.messaging || [];
        for (const ev of events) {
          const senderId = ev?.sender?.id;
          const msgText  = ev?.message?.text;

          // Ghi log để debug trên Vercel (Deployments → Functions → Logs)
          console.log("Incoming:", JSON.stringify(ev));

          // Trả lời ECHO rất đơn giản
          if (senderId && msgText && PAGE_TOKEN) {
            const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(PAGE_TOKEN)}`;
            await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: senderId },
                message:   { text: `Xin chào! Bạn vừa nói: "${msgText}"` }
              })
            });
          }
        }
      }

      // Luôn trả 200 để Facebook không retry quá mức
      return res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(200).send("OK");
    }
  }

  // 3) Phương thức khác
  return res.status(405).send("Method Not Allowed");
}


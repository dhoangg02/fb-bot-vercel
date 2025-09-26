import OpenAI from "openai";

let client;

function getClient(apiKey) {
  if (!apiKey) {
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function createSmartReplyGenerator({
  apiKey,
  model = "gpt-4o-mini",
  systemPrompt = "Bạn là trợ lý thân thiện của một trang Facebook, luôn trả lời ngắn gọn và hữu ích bằng tiếng Việt.",
  maxTokens = 200,
  temperature = 0.7,
} = {}) {
  const openai = getClient(apiKey);

  if (!openai) {
    return async () => null;
  }

  return async function generateSmartReply(message, context = {}) {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    if (context?.senderId) {
      messages.push({
        role: "system",
        content: `ID người dùng Facebook: ${context.senderId}`,
      });
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return completion?.choices?.[0]?.message?.content ?? null;
  };
}


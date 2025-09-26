const HELLO_REGEX = /\bhello\b/i;

function normalizeText(text) {
  return typeof text === "string" ? text.trim() : "";
}

function attachmentsSummary(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }
  const types = attachments
    .map((att) => att?.type)
    .filter(Boolean)
    .map((type) => type.toLowerCase());
  if (types.length === 0) {
    return `tệp đính kèm`;
  }
  const unique = [...new Set(types)];
  return unique.length === 1
    ? `tệp ${unique[0]}`
    : `tệp (${unique.join(", ")})`;
}

export async function processMessagingEvent(event, deps) {
  const {
    sendTextMessage,
    generateSmartReply,
    logMessage,
    fallbackMessage = "Xin cảm ơn bạn đã liên hệ!",
  } = deps || {};

  const senderId = event?.sender?.id;
  const message = event?.message;

  if (!senderId || !message || message?.is_echo) {
    return {
      handled: false,
      reason: !senderId ? "missing_sender" : message?.is_echo ? "echo" : "missing_message",
    };
  }

  const text = normalizeText(message.text);
  const hasText = Boolean(text);
  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;

  const now = new Date();
  const logPayload = {
    timestamp: now.toISOString(),
    senderId,
    text: hasText ? text : null,
    hasAttachments,
  };

  let replyText = null;

  if (hasText && HELLO_REGEX.test(text)) {
    replyText = "Xin chào! Mình có thể giúp gì cho bạn hôm nay?";
  } else if (hasText) {
    try {
      replyText = (await generateSmartReply?.(text, { senderId }))?.trim();
    } catch (err) {
      console.error("OpenAI reply error", err);
    }
  }

  if (!replyText && hasAttachments) {
    const summary = attachmentsSummary(message.attachments);
    replyText = `Mình đã nhận được ${summary || "tệp"} của bạn. Bạn có thể cho mình biết thêm chi tiết không?`;
  }

  if (!replyText) {
    replyText = fallbackMessage;
  }

  if (typeof sendTextMessage === "function") {
    await sendTextMessage(senderId, replyText);
  }

  if (typeof logMessage === "function") {
    try {
      await logMessage({
        ...logPayload,
        reply: replyText,
      });
    } catch (err) {
      console.error("Log message error", err);
    }
  }

  return { handled: true, replyText };
}

export function buildDependencies(options = {}) {
  const {
    sendTextMessage,
    generateSmartReply,
    logMessage,
    fallbackMessage,
  } = options;

  return {
    sendTextMessage,
    generateSmartReply,
    logMessage,
    fallbackMessage,
  };
}


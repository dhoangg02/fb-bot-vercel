import test from "node:test";
import assert from "node:assert/strict";
import { processMessagingEvent } from "../lib/messageProcessor.js";

function buildEvent({ senderId = "123", text, attachments } = {}) {
  return {
    sender: { id: senderId },
    message: {
      text,
      attachments,
    },
  };
}

test("responds with hello template when user says hello", async () => {
  const messages = [];
  const event = buildEvent({ text: "hello there" });

  const result = await processMessagingEvent(event, {
    sendTextMessage: async (id, text) => messages.push({ id, text }),
  });

  assert.equal(result.replyText.includes("Xin chào"), true);
  assert.equal(messages[0].text, result.replyText);
});

test("uses smart reply when available", async () => {
  const event = buildEvent({ text: "Tell me a joke" });
  const result = await processMessagingEvent(event, {
    sendTextMessage: async () => {},
    generateSmartReply: async () => "Here is a joke",
  });

  assert.equal(result.replyText, "Here is a joke");
});

test("handles attachments without crashing", async () => {
  const event = buildEvent({ text: "", attachments: [{ type: "image" }] });
  const result = await processMessagingEvent(event, {
    sendTextMessage: async () => {},
  });

  assert.ok(result.replyText.includes("tệp"));
});

test("falls back gracefully when sender missing", async () => {
  const result = await processMessagingEvent({}, {});
  assert.equal(result.handled, false);
});


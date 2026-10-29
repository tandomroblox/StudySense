import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");

test("The AI tutor is a conversation composer rather than a subject/chapter form", () => {
  const shell = read("public/app-shell.html");
  assert.ok(shell.includes('id="tutorTranscript"'));
  assert.ok(shell.includes('id="tutorInput"'));
  assert.ok(shell.includes('id="tutorSubmit"'));
  assert.ok(!shell.includes('id="tutorSubject"'));
  assert.ok(!shell.includes('id="tutorChapter"'));
  assert.ok(!shell.includes('id="tutorContext"'));
  assert.ok(shell.includes("Subject selection is automatic."));
});

test("The chat supports Enter to send, Shift+Enter for a newline, and recent follow-up messages", () => {
  const script = read("public/script.js");
  assert.ok(script.includes('event.key==="Enter"&&!event.shiftKey&&!event.isComposing'));
  assert.ok(script.includes("tutorForm.requestSubmit()"));
  assert.ok(script.includes("messages:outgoing"));
  assert.ok(script.includes('tutorConversation=[...outgoing,{role:"assistant",content:answer}]'));
});

test("The tutor API accepts bounded chat history and infers likely subject", () => {
  const worker = read("src/index.js");
  assert.ok(worker.includes("const hasConversation = Array.isArray(body?.messages)"));
  assert.ok(worker.includes("body.messages.length > 16"));
  assert.ok(worker.includes('messages[messages.length - 1]?.role !== "user"'));
  assert.ok(worker.includes("Infer the likely school subject and topic from the conversation."));
  assert.ok(worker.includes("does not currently retrieve the planned PDF collection automatically"));
  assert.ok(worker.includes('if (url.pathname === "/api/tutor" && request.method === "POST")'));
});

test("The offline cache is bumped for the updated authentication and chat experience", () => {
  assert.ok(read("public/sw.js").includes('const CACHE_NAME = "studysense-shell-v6"'));
});

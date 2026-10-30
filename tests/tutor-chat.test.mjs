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
  assert.ok(worker.includes("const hasConversation = Array.isArray(body.messages)"));
  assert.ok(worker.includes("body.messages.length > 24"));
  assert.ok(worker.includes('messages[messages.length - 1]?.role !== "user"'));
  assert.ok(worker.includes("You are not limited to school subjects, a particular curriculum, grade, textbook, or study material."));
  assert.ok(worker.includes("Do not claim to have searched or read StudySense PDFs, files, or study materials unless their contents are actually provided in the conversation."));
  assert.ok(worker.includes('if (url.pathname === "/api/tutor" && request.method === "POST")'));
});

test("The offline cache is bumped for the updated authentication and chat experience", () => {
  assert.ok(read("public/sw.js").includes('const CACHE_NAME = "studysense-shell-v8"'));
});

test("Calendar, mistake notebook, study sessions and analytics have authenticated API routes", () => {
  const worker = read("src/index.js");
  for (const route of ["/api/calendar", "/api/mistakes", "/api/study-sessions", "/api/analytics", "/api/preferences"]) {
    assert.ok(worker.includes('url.pathname === "' + route + '"') || worker.includes('url.pathname.startsWith("' + route + '/")'), route);
  }
  assert.ok(worker.includes("WHERE user_id=?"));
  assert.ok(worker.includes("migration 0007"));
});

test("The web study workspace exposes calendar, mistake notebook and analytics controls", () => {
  const script = read("public/study-tools.js");
  for (const id of ["hubCalendarForm", "hubMistakeForm", "hubAnalyticsSummary", "hubStudyLogForm"]) {
    assert.ok(script.includes('id="' + id + '"'), id);
  }
});

test("Study preferences, export and review mode are connected to real account data", () => {
  const script = read("public/study-tools.js");
  assert.ok(script.includes('safeApi("/api/preferences"'));
  assert.ok(script.includes('safeApi("/api/practice")'));
  assert.ok(script.includes('safeApi("/api/calendar")'));
  assert.ok(script.includes('safeApi("/api/mistakes")'));
  assert.ok(script.includes('studysense-data-export.json'));
  assert.ok(script.includes("Notification.requestPermission()"));
  assert.ok(script.includes("hubReviewReveal"));
  assert.ok(script.includes("weeklyGoal"));
});

test("The AI tutor supports browser voice input and spoken answers", () => {
  const shell = read("public/app-shell.html");
  const script = read("public/script.js");
  assert.ok(shell.includes('id="tutorVoiceInput"'));
  assert.ok(shell.includes('id="tutorSpeak"'));
  assert.ok(script.includes("window.SpeechRecognition||window.webkitSpeechRecognition"));
  assert.ok(script.includes("SpeechSynthesisUtterance"));
});

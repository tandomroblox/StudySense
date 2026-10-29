import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const source = read("public/script.js");

test("Signing in refreshes the full account dashboard, not only tasks", () => {
  const start = source.indexOf('authForm.addEventListener("submit"');
  const end = source.indexOf('logoutButton.addEventListener("click"', start);
  assert.ok(start >= 0 && end > start, "Could not locate the sign-in handler");
  const handler = source.slice(start, end);
  assert.match(handler, /showSignedIn\(user\.user\)/);
  for (const loader of ["loadTasks()", "loadExams()", "loadLearningTools()", "loadProfile()"]) {
    assert.ok(handler.includes(loader), "Sign-in handler must refresh " + loader);
  }
});

test("The sign-in form stays hidden until session restoration completes", () => {
  const shell = read("public/app-shell.html");
  assert.match(shell, /id="authLoadingPanel"[^>]*role="status"/);
  assert.match(shell, /id="authPanel" class="card auth-panel" hidden/);
  const signedOut = source.slice(source.indexOf("function showSignedOut"), source.indexOf("function showSignedIn"));
  const signedIn = source.slice(source.indexOf("function showSignedIn"), source.indexOf('authForm.addEventListener("submit"'));
  assert.match(signedOut, /authLoadingPanel\.hidden = true/);
  assert.match(signedIn, /authLoadingPanel\.hidden = true/);
});

test("Session loading state is cleared for both authenticated and signed-out results", () => {
  const shellScript = read("public/app-shell.js");
  assert.match(shellScript, /Restoring your study space/);
  const start = source.slice(source.indexOf("async function start()"), source.indexOf("// Focus timer"));
  assert.match(start, /showSignedIn\(data\.user\)/);
  assert.match(start, /showSignedOut\(/);
});

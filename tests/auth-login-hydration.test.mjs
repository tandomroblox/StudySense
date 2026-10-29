import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "public/script.js"), "utf8");

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


test("Session restoration keeps the sign-in form hidden until authentication is resolved", () => {
  const shell = fs.readFileSync(path.join(root, "public/app-shell.html"), "utf8");
  const shellScript = fs.readFileSync(path.join(root, "public/app-shell.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "public/style.css"), "utf8");
  const serviceWorker = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
  assert.match(shell, /id="authLoadingPanel"[^>]*role="status"/);
  assert.match(shell, /id="authPanel" class="card auth-panel" hidden/);
  assert.ok(shellScript.includes('document.body.classList.add("auth-checking")'),
    "Every route must enter a neutral loading state before mounting the app shell");
  assert.ok(source.includes('authLoadingPanel.hidden = true'), "Session resolution must remove the loading state");
  assert.ok(source.includes('document.body.classList.remove("is-signed-in", "auth-checking")'),
    "The signed-out state must reveal sign-in only after the session check");
  assert.ok(source.includes('document.body.classList.remove("auth-checking")'),
    "The signed-in state must release the startup gate");
  assert.ok(css.includes("body.auth-checking .site-nav") && css.includes("body.auth-checking .account-menu"),
    "Navigation space should be reserved while authentication is being checked");
  assert.ok(serviceWorker.includes("studysense-shell-v6"), "Users must receive the new session-loading shell");
});

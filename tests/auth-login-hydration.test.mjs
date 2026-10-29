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


test("The login form stays hidden until the session check finishes", () => {
  const shell = fs.readFileSync(path.join(root, "public/app-shell.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "public/style.css"), "utf8");
  assert.ok(shell.includes('id="sessionBootPanel"'), "A session-restoration status should be visible while auth loads");
  assert.ok(css.includes("body:not(.session-ready) #authPanel"), "The login form must be hidden before session resolution");
  assert.ok(source.includes('const sessionBootPanel = document.querySelector("#sessionBootPanel")'));
  const signedOutStart = source.indexOf("function showSignedOut(");
  const signedInStart = source.indexOf("function showSignedIn(", signedOutStart);
  const authSubmitStart = source.indexOf('authForm.addEventListener("submit"', signedInStart);
  assert.ok(signedOutStart >= 0 && signedInStart > signedOutStart);
  const signedOut = source.slice(signedOutStart, signedInStart);
  const signedIn = source.slice(signedInStart, authSubmitStart);
  for (const handler of [signedOut, signedIn]) {
    assert.ok(handler.includes('document.body.classList.add("session-ready"'), "Auth transitions must release the initial loading state");
    assert.ok(handler.includes("sessionBootPanel.hidden = true"), "Auth transitions must hide the temporary loading panel");
  }
  assert.ok(signedOut.includes("authPanel.hidden = false"), "A real signed-out state must show the login form");
  assert.ok(signedIn.includes("authPanel.hidden = true"), "A signed-in state must keep the login form hidden");
});

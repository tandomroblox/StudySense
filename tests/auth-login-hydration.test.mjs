import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const shell = read("public/app-shell.js");
const auth = read("public/auth.js");
const dashboard = read("public/script.js");
const html = read("public/app-shell.html");

test("The login route loads a dedicated auth module, not the dashboard bundle", () => {
  assert.match(shell, /if \(isAuthRoute\)[\s\S]*?loadScript\("\/auth\.js"\)/);
  const authStart = shell.indexOf("if (isAuthRoute)");
  const authEnd = shell.indexOf("} else {", authStart);
  const authBranch = shell.slice(authStart, authEnd);
  assert.doesNotMatch(authBranch, /loadScript\("\/script\.js"\)/);
  assert.match(auth, /authForm\.addEventListener\("submit"/);
});

test("Email sign-in and registration verify the HttpOnly session before redirecting", () => {
  assert.match(auth, /\/api\/auth\/register/);
  assert.match(auth, /\/api\/auth\/login/);
  assert.match(auth, /credentials: "same-origin"/);
  assert.match(auth, /async function verifySession\(\)/);
  assert.match(auth, /const user = await verifySession\(\)/);
  assert.match(auth, /if \(!user\)/);
  assert.match(auth, /window\.location\.replace\("\/dashboard\.html"\)/);
});

test("The auth page remains usable when the initial session check fails", () => {
  assert.match(auth, /Keep the form usable even if the session-check request is temporarily unavailable/);
  assert.match(auth, /emailInput\.focus/);
  assert.match(html, /id="authPanel" class="card auth-panel" hidden/);
});

test("Returning signed-in users are still redirected from login", () => {
  assert.match(auth, /if \(user\)[\s\S]*?window\.location\.replace\("\/dashboard\.html"\)/);
});

test("Dashboard hydration continues to load account data after authentication", () => {
  assert.match(dashboard, /api\("\/api\/auth\/me"\)/);
  for (const loader of ["loadTasks()", "loadExams()", "loadLearningTools()", "loadProfile()"]) {
    assert.ok(dashboard.includes(loader), "Dashboard must retain " + loader);
  }
});

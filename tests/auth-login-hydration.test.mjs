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

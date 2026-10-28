import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "public/study-tools.js"), "utf8");
const sourceLines = source.split("\n");

function sourceLine(prefix) {
  const line = sourceLines.find(value => value.includes(prefix));
  assert.ok(line, "Expected source line containing: " + prefix);
  return line.trim();
}

test("Readiness normalizes part-specific subjects before matching practice history", () => {
  assert.equal(
    sourceLine("const key = String(p.subject"),
    String.raw`const key = String(p.subject || "").replace(/\s+—\s+Part\s+(?:I|II)$/i, "");`
  );
  assert.equal(
    sourceLine("const normaliseSubject = value"),
    String.raw`const normaliseSubject = value => String(value || "").replace(/\s+—\s+Part\s+(?:I|II)$/i, "");`
  );
});

test("Daily-plan duplicate detection removes the duration suffix", () => {
  assert.equal(
    sourceLine("const normalizeTaskTitle = title"),
    String.raw`const normalizeTaskTitle = title => String(title || "").trim().toLowerCase().replace(/\s+\(\d+ min\)$/, "");`
  );
});

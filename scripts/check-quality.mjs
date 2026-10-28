import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const requiredFiles = [
  "src/index.js", "wrangler.jsonc", "public/index.html", "public/app-shell.html",
  "public/app-shell.js", "public/planner.html", "public/exams.html", "public/syllabus.html",
  "public/learn.html", "public/library.html", "public/profile.html", "public/time-guard.html",
  "public/time-guard.css", "public/style.css",
  "public/script.js", "public/syllabus.js", "public/sw.js", "public/study-tools.js",
  "public/study-tools.css", "tests/pages.test.mjs", "browser-extension/manifest.json",
  "browser-extension/README.md", "browser-extension/background.js", "browser-extension/popup.html",
  "browser-extension/popup.css", "browser-extension/popup.js", "browser-extension/break.html",
  "browser-extension/break.css", "browser-extension/break.js",
  ".github/workflows/release-time-guard.yml",
  "migrations/0005_profiles.sql", "migrations/0006_revision_library.sql"
];
for (const file of requiredFiles) assert.ok(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`);

const shellHtml = read("public/app-shell.html");
const ids = [...shellHtml.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const idSet = new Set();
const duplicates = [];
for (const id of ids) {
  if (idSet.has(id)) duplicates.push(id);
  idSet.add(id);
}
assert.deepEqual(duplicates, [], "Shared app shell must not contain duplicate IDs");

const pageFiles = [
  "public/index.html", "public/planner.html", "public/exams.html",
  "public/syllabus.html", "public/learn.html", "public/library.html", "public/profile.html", "public/time-guard.html",
  "public/app-shell.html"
];
for (const htmlPath of pageFiles) {
  const html = read(htmlPath);
  for (const match of html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
    const uri = match[1];
    if (/^(?:https?:|data:|#|mailto:|javascript:)/i.test(uri)) continue;
    const pathname = new URL(uri, "https://studysense.invalid").pathname;
    if (pathname.startsWith("/api/")) continue;
    const asset = path.join(root, "public", pathname.startsWith("/") ? pathname.slice(1) : pathname);
    assert.ok(fs.existsSync(asset), `Broken local asset reference in ${htmlPath}: ${uri}`);
  }
}

const wrangler = JSON.parse(read("wrangler.jsonc"));
assert.equal(wrangler.name, "studysense");
assert.equal(wrangler.d1_databases?.[0]?.binding, "DB");
assert.equal(wrangler.d1_databases?.[0]?.database_name, "studysense-db");
assert.equal(wrangler.ai?.binding, "AI");
assert.equal(wrangler.assets?.binding, "ASSETS");

const manifest = JSON.parse(read("browser-extension/manifest.json"));
assert.equal(manifest.manifest_version, 3);
assert.ok(manifest.permissions.includes("storage"));
assert.ok(manifest.permissions.includes("declarativeNetRequest"));
assert.ok(manifest.permissions.includes("notifications"));
assert.equal(manifest.version, "1.2.0");
assert.equal(Object.hasOwn(manifest, "optional_host_permissions"), false, "Default site tracking should not require per-site host confirmation");
assert.ok(read("browser-extension/background.js").includes("DEFAULT_RESTRICTED_DOMAINS"));
for (const resource of [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons || {}), ...Object.values(manifest.action.default_icon || {})]) {
  assert.ok(fs.existsSync(path.join(root, "browser-extension", resource)), `Missing extension resource: ${resource}`);
}

const worker = read("src/index.js");
for (const route of ["/api/profile", "/api/tutor", "/api/revisions", "/api/library", "/api/practice/generate", "/api/exams", "/api/chapters", "/api/flashcards", "/api/practice", "/api/tasks"]) {
  assert.ok(worker.includes(route), `Missing expected API route: ${route}`);
}
assert.ok(!read("public/syllabus.js").includes("const midpoint"), "Curriculum must never use a guessed midpoint to split book volumes");
assert.ok(read("public/sw.js").includes("/study-tools.js"), "Offline shell must include the learning tools script");
assert.ok(read("public/sw.js").includes("/study-tools.css"), "Offline shell must include the learning tools styles");
assert.ok(read("migrations/0006_revision_library.sql").includes("study_library_items"));
assert.ok(read("migrations/0006_revision_library.sql").includes("chapter_revision_state"));
console.log("StudySense quality checks passed.");


const extensionRelease = read(".github/workflows/release-time-guard.yml");
assert.ok(extensionRelease.includes("softprops/action-gh-release@v2"), "Time Guard packages must be published as a release");
assert.ok(extensionRelease.includes("StudySense-Time-Guard.zip"), "Time Guard release must contain the installable ZIP");
assert.ok(extensionRelease.includes("contents: write"), "Time Guard release workflow needs release-write permission");

assert.ok(read("browser-extension/background.js").includes('chrome.windows.create'), "Cooldown must open the custom break popup");
assert.ok(read(".github/workflows/release-time-guard.yml").includes("browser-extension/break.js"), "The release ZIP must include break popup assets");

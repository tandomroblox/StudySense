import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const pages = {
  dashboard: "public/index.html",
  planner: "public/planner.html",
  exams: "public/exams.html",
  syllabus: "public/syllabus.html",
  learn: "public/learn.html",
  library: "public/library.html",
  profile: "public/profile.html"
};

test("Every StudySense destination is a standalone route using the shared shell", () => {
  for (const [route, file] of Object.entries(pages)) {
    const html = read(file);
    assert.match(html, new RegExp('<body data-page="' + route + '"'));
    assert.ok(html.includes('id="appRoot"'), file + " must provide the shell mount");
    assert.ok(html.includes('src="/app-shell.js"'), file + " must load the shared shell");
  }
});

test("The shared shell has unique IDs and all cross-page destinations exist", () => {
  const shell = read("public/app-shell.html");
  const ids = [...shell.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "Shared shell IDs must be unique");
  const links = [...shell.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
  for (const href of links.filter(value => value.startsWith("/") && value.endsWith(".html"))) {
    const pathname = href === "/" ? "public/index.html" : "public" + href;
    assert.ok(fs.existsSync(path.join(root, pathname)), "Missing navigation destination: " + href);
  }
  for (const id of ["accountMenuButton", "accountMenuPanel", "profileSection", "plannerSection",
    "examCenterSection", "syllabusTrackerSection", "examStudyPlanSection", "tutorSection",
    "flashcardsSection", "practiceLogSection", "dashboardStats"]) {
    assert.ok(shell.includes('id="' + id + '"'), "Missing shared element " + id);
    
  }
  for (const subject of ["Mathematics — Part I", "Mathematics — Part II", "Social Science — Part I", "Social Science — Part II"]) {
    assert.ok(shell.includes("<option>" + subject + "</option>"), "Manual chapter entry must support " + subject);
  }
});

test("The account menu holds profile controls in the header, not in the page flow", () => {
  const shell = read("public/app-shell.html");
  const header = shell.slice(shell.indexOf('<header class="topbar">'), shell.indexOf("</header>"));
  assert.ok(header.includes('id="accountMenu"'));
  assert.ok(header.includes('href="/profile.html"'));
  assert.ok(header.includes('id="connectGoogleButton"'));
  assert.ok(header.includes('id="logoutButton"'));
  assert.ok(!shell.includes('<div class="account-bar">'));
  assert.match(read("public/style.css"), /\.account-dropdown\s*\{/);
});

test("Each route has a dedicated visibility rule and the offline shell caches all pages", () => {
  const css = read("public/style.css");
  const worker = read("public/sw.js");
  for (const route of Object.keys(pages)) {
    assert.ok(css.includes('body[data-page="' + route + '"]'), "No content layout for " + route);
    if (route !== "dashboard") assert.ok(worker.includes('/' + pages[route].split("/").pop() + '"'), "Offline cache missing " + route);
  }
  assert.ok(worker.includes('"/app-shell.html"'));
  assert.ok(worker.includes('"/app-shell.js"'));
  assert.ok(worker.includes("url.pathname.startsWith(\"/api/\")"), "API responses must never enter the offline cache");
});

test("The shared shell loads feature scripts only after its HTML is mounted", () => {
  const shellJs = read("public/app-shell.js");
  assert.ok(shellJs.indexOf("root.innerHTML = await response.text()") < shellJs.indexOf('await loadScript("/syllabus.js")'));
  assert.ok(shellJs.indexOf('await loadScript("/syllabus.js")') < shellJs.indexOf('await loadScript("/script.js")'));
  assert.ok(shellJs.indexOf('await loadScript("/script.js")') < shellJs.indexOf('await loadScript("/study-tools.js")'));
});

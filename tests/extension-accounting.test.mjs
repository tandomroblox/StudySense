import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "browser-extension/background.js"), "utf8");
const event = { addListener() {} };
let storageState = {};
const createdWindows = [];
const openTabs = [];
const redirectedTabs = [];
const ruleChanges = [];
const chrome = {
  runtime: { onInstalled: event, onStartup: event, onMessage: event, sendMessage: async () => ({}), getURL: path => "chrome-extension://studysense/" + path },
  alarms: { onAlarm: event, create() {} },
  tabs: { onActivated: event, onUpdated: event, query: async () => openTabs, update: async (id, properties) => { redirectedTabs.push({ id, ...properties }); return { id, ...properties }; } },
  windows: { onFocusChanged: event, WINDOW_ID_NONE: -1, getLastFocused: async () => ({ focused: false }), create: async options => { createdWindows.push(options); return { id: 99 }; } },
  storage: { local: {
    get: async keys => {
      if (Array.isArray(keys)) return Object.fromEntries(keys.filter(key => Object.hasOwn(storageState, key)).map(key => [key, storageState[key]]));
      return { ...storageState };
    },
    set: async values => { Object.assign(storageState, values); }
  } },
  declarativeNetRequest: { getDynamicRules: async () => [], updateDynamicRules: async rules => { ruleChanges.push(rules); } },
  notifications: { create: async () => "notification-id" }
};
const api = vm.runInNewContext(source + "\n;({ localDayKey, addUsageSegment, pruneHistory, matchesDomain, validDomainList, ALLOWANCE_SECONDS, MAX_HISTORY_DAYS, DEFAULT_RESTRICTED_DOMAINS, COOLDOWN_MS, initialize, tick })", {
  chrome, URL, Date, Math, Object, Array, String, RegExp, Error, Set, Number
});

test("usage intervals split correctly across local midnight", () => {
  const history = {};
  const start = new Date(2026, 0, 10, 23, 59, 50).getTime();
  const end = new Date(2026, 0, 11, 0, 0, 10).getTime();
  const todaySeconds = api.addUsageSegment(history, "example.com", start, end);
  assert.equal(todaySeconds, 10);
  assert.equal(history["2026-01-10"]["example.com"], 10);
  assert.equal(history["2026-01-11"]["example.com"], 10);
});

test("tracked hosts include subdomains but not lookalike domains", () => {
  assert.equal(api.matchesDomain("video.example.com", "example.com"), true);
  assert.equal(api.matchesDomain("example.com.evil.test", "example.com"), false);
});

test("restricted domain settings validate and deduplicate hostnames", () => {
  assert.deepEqual(Array.from(api.validDomainList(["youtube.com", "youtube.com", "instagram.com"])), ["youtube.com", "instagram.com"]);
  assert.throws(() => api.validDomainList(["https://example.com/path"]), /Invalid domain|URL path/);
  assert.throws(() => api.validDomainList(Array.from({ length: 51 }, (_, i) => "site" + i + ".example")), /no more than 50/i);
});

test("usage history prunes old dates to the intended retention window", () => {
  const history = {
    "2025-01-01": { "old.example": 100 },
    "2026-01-01": { "current.example": 100 }
  };
  const today = "2026-01-01";
  api.pruneHistory(history, today);
  assert.equal(Object.hasOwn(history, "2025-01-01"), false);
  assert.equal(Object.hasOwn(history, "2026-01-01"), true);
  assert.equal(api.ALLOWANCE_SECONDS, 900);
  assert.equal(api.MAX_HISTORY_DAYS, 90);
});


test("first run seeds common entertainment sites and starts tracking automatically", async () => {
  storageState = {};
  await api.initialize();
  assert.deepEqual(Array.from(storageState.restrictedDomains), [
    "youtube.com", "instagram.com", "tiktok.com", "reddit.com",
    "facebook.com", "x.com", "twitch.tv", "netflix.com"
  ]);
  assert.equal(storageState.enabled, true);
  assert.equal(storageState.trackMode, "selected");
  assert.equal(api.DEFAULT_RESTRICTED_DOMAINS.length, 8);
});

test("combined allowance across flagged sites opens the break window and starts cooldown", async () => {
  const now = Date.now();
  const today = api.localDayKey(now);
  storageState = {
    restrictedDomains: ["youtube.com", "instagram.com"],
    trackedDomains: ["youtube.com", "instagram.com"],
    trackMode: "selected",
    enabled: true,
    phase: "ready",
    usedSeconds: 899,
    phaseEndsAt: 0,
    restrictionDay: today,
    lastTickAt: now - 2000,
    currentDomain: "instagram.com",
    usageByDay: { [today]: { "youtube.com": 899 } },
    notificationsEnabled: true
  };
  const before = createdWindows.length;
  openTabs.length = 0;
  redirectedTabs.length = 0;
  openTabs.push({ id: 7, url: "https://www.youtube.com/watch?v=example" });
  await api.tick();
  assert.equal(storageState.phase, "cooldown");
  assert.equal(storageState.usedSeconds, 900);
  assert.ok(storageState.phaseEndsAt - now >= api.COOLDOWN_MS - 2000);
  assert.ok(storageState.phaseEndsAt - now <= api.COOLDOWN_MS + 1000);
  const popup = createdWindows.slice(before).find(options => options.url.endsWith("/break.html"));
  assert.ok(popup, "The cooldown must open the custom break window");
  assert.equal(popup.type, "popup");
  assert.ok(redirectedTabs.some(tab => tab.id === 7 && tab.url.endsWith("/break.html")), "Already-open flagged tabs should be redirected to the break screen");
  assert.ok(ruleChanges.some(change => change.addRules?.some(rule => rule.action.type === "block" && rule.condition.urlFilter.includes("instagram.com"))),
    "Cooldown should block the flagged websites");
});

test("hostnames can be monitored and blocked without optional per-site host grants", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "browser-extension/manifest.json"), "utf8"));
  assert.ok(manifest.permissions.includes("tabs"));
  assert.ok(manifest.permissions.includes("declarativeNetRequest"));
  assert.equal(Object.hasOwn(manifest, "optional_host_permissions"), false);
  const popupScript = fs.readFileSync(path.join(root, "browser-extension/popup.js"), "utf8");
  assert.equal(popupScript.includes("chrome.permissions.request"), false);
  assert.ok(fs.existsSync(path.join(root, "browser-extension/break.html")));
  assert.ok(fs.existsSync(path.join(root, "browser-extension/break.css")));
  assert.ok(fs.existsSync(path.join(root, "browser-extension/break.js")));
});

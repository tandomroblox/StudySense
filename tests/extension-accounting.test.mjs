import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "browser-extension/background.js"), "utf8");
const event = { addListener() {} };
const chrome = {
  runtime: { onInstalled: event, onStartup: event, onMessage: event, sendMessage: async () => ({}) },
  alarms: { onAlarm: event, create() {} },
  tabs: { onActivated: event, onUpdated: event, query: async () => [] },
  windows: { onFocusChanged: event, WINDOW_ID_NONE: -1, getLastFocused: async () => ({ focused: false }) },
  storage: { local: { get: async () => ({}), set: async () => ({}) } },
  declarativeNetRequest: { getDynamicRules: async () => [], updateDynamicRules: async () => ({}) },
  notifications: { create: async () => ({}) }
};
const api = vm.runInNewContext(source + "\n;({ localDayKey, addUsageSegment, pruneHistory, matchesDomain, validDomainList, ALLOWANCE_SECONDS, MAX_HISTORY_DAYS })", {
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

const ALLOWANCE_SECONDS = 15 * 60;
const COOLDOWN_MS = 35 * 60 * 1000;
const ALARM = "studysense-usage-tick";
const RULE_BASE = 7100;
const RULE_LIMIT = RULE_BASE + 1000;
const MAX_RESTRICTED_DOMAINS = 50;
const MAX_HISTORY_DAYS = 90;
const DEFAULT_RESTRICTED_DOMAINS = ["youtube.com","instagram.com","tiktok.com","reddit.com","facebook.com","x.com","twitch.tv","netflix.com"];

function localDayKey(timestamp) {
  const date = new Date(timestamp === undefined ? Date.now() : timestamp);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}
function addDays(dateKey, days) {
  const date = new Date(dateKey + "T12:00:00");
  date.setDate(date.getDate() + days);
  return localDayKey(date.getTime());
}
function normalizeHost(host) {
  return String(host || "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
}
function matchesDomain(host, domain) {
  return host === domain || host.endsWith("." + domain);
}
function asPlainWebsite(urlText) {
  try {
    const url = new URL(urlText);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}
async function state() {
  return chrome.storage.local.get([
    "restrictedDomains", "trackedDomains", "trackMode", "phase", "usedSeconds",
    "phaseEndsAt", "lastTickAt", "currentDomain", "usageByDay", "enabled",
    "restrictionDay", "notificationsEnabled"
  ]);
}
function pruneHistory(history, today) {
  const cutoff = addDays(today, -(MAX_HISTORY_DAYS - 1));
  for (const key of Object.keys(history)) {
    if (key < cutoff || !history[key] || typeof history[key] !== "object") delete history[key];
  }
  return history;
}
function addUsageSegment(history, domain, startMs, endMs) {
  let cursor = startMs;
  let todaySeconds = 0;
  const today = localDayKey(endMs);
  while (cursor < endMs) {
    const date = new Date(cursor);
    const nextMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const segmentEnd = Math.min(endMs, nextMidnight);
    const seconds = Math.max(0, Math.floor((segmentEnd - cursor) / 1000));
    const day = localDayKey(cursor);
    if (seconds > 0) {
      if (!history[day]) history[day] = {};
      history[day][domain] = (Number(history[day][domain]) || 0) + seconds;
      if (day === today) todaySeconds += seconds;
    }
    cursor = segmentEnd;
  }
  return todaySeconds;
}
function resolvedDomain(host, restrictedDomains) {
  return restrictedDomains.find(domain => matchesDomain(host, domain)) || host;
}
async function activeSite(currentState) {
  try {
    const win = await chrome.windows.getLastFocused({ populate: false });
    if (!win || win.focused === false || win.id === chrome.windows.WINDOW_ID_NONE) return null;
    const tabs = await chrome.tabs.query({ active: true, windowId: win.id });
    const host = asPlainWebsite(tabs[0] && tabs[0].url);
    if (!host) return null;
    const domains = currentState.restrictedDomains || [];
    if ((currentState.trackMode || "selected") === "all") return resolvedDomain(host, domains);
    return domains.find(domain => matchesDomain(host, domain)) || null;
  } catch {
    return null;
  }
}
async function syncRules(domains, phase) {
  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = oldRules.filter(rule => rule.id >= RULE_BASE && rule.id < RULE_LIMIT).map(rule => rule.id);
  const addRules = phase === "cooldown" ? domains.slice(0, MAX_RESTRICTED_DOMAINS).map((domain, index) => ({
    id: RULE_BASE + index,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: "||" + domain + "^", resourceTypes: ["main_frame"] }
  })) : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
}
async function redirectOpenRestrictedTabs(domains) {
  try {
    const tabs = await chrome.tabs.query({});
    const redirects = tabs
      .filter(tab => Number.isInteger(tab.id) && domains.some(domain => {
        const host = asPlainWebsite(tab.url);
        return host && matchesDomain(host, domain);
      }))
      .map(tab => chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("break.html") }).catch(() => {}));
    await Promise.all(redirects);
  } catch (_) {}
}
function openBreakPopup() {
  try {
    const pending = chrome.windows.create({
      url: chrome.runtime.getURL("break.html"),
      type: "popup",
      width: 460,
      height: 570,
      focused: true
    });
    if (pending && typeof pending.catch === "function") pending.catch(() => {});
  } catch (_) {}
}
function notifyCooldown() {
  chrome.storage.local.get(["notificationsEnabled"]).then(settings => {
    if (settings.notificationsEnabled === false) return;
    try {
      chrome.notifications.create("studysense-cooldown", {
        type: "basic",
        iconUrl: "icon.png",
        title: "StudySense · Break time",
        message: "Your combined 15-minute allowance across restricted websites is used. The 35-minute cooldown has started.",
        priority: 1
      });
    } catch (_) {}
  }).catch(() => {});
}
async function sendStateChanged() {
  try { await chrome.runtime.sendMessage({ type: "state-changed" }); } catch (_) {}
}
async function tick() {
  const s = await state();
  const now = Date.now();
  const today = localDayKey(now);
  const restricted = Array.isArray(s.restrictedDomains) ? s.restrictedDomains : (s.trackedDomains || []);
  let usageByDay = s.usageByDay && typeof s.usageByDay === "object" ? s.usageByDay : {};
  let usedSeconds = Number(s.usedSeconds) || 0;
  let phase = s.phase === "cooldown" ? "cooldown" : "ready";
  let phaseEndsAt = Number(s.phaseEndsAt) || 0;
  let restrictionDay = s.restrictionDay || today;
  const lastTickAt = Number(s.lastTickAt) || now;
  const delta = Math.min(90, Math.max(0, Math.floor((now - lastTickAt) / 1000)));
  const previousDomain = s.currentDomain || null;
  const previousPhase = phase;
  let todayDelta = 0;
  let cooldownStarted = false;

  if (previousDomain && delta > 0) {
    const startMs = now - delta * 1000;
    todayDelta = addUsageSegment(usageByDay, previousDomain, startMs, now);
    if (previousPhase !== "cooldown" && restricted.some(domain => matchesDomain(previousDomain, domain))) {
      usedSeconds += todayDelta;
    }
  }
  usageByDay = pruneHistory(usageByDay, today);

  if (restrictionDay !== today) {
    restrictionDay = today;
    usedSeconds = previousPhase === "cooldown" ? Math.min(usedSeconds, ALLOWANCE_SECONDS) : todayDelta;
  }
  if (phase === "cooldown" && now >= phaseEndsAt) {
    phase = "ready";
    phaseEndsAt = 0;
    usedSeconds = 0;
  }
  if (phase !== "cooldown" && restricted.length && usedSeconds >= ALLOWANCE_SECONDS) {
    phase = "cooldown";
    phaseEndsAt = now + COOLDOWN_MS;
    usedSeconds = ALLOWANCE_SECONDS;
    cooldownStarted = previousPhase !== "cooldown";
  }
  const domain = s.enabled ? await activeSite({ ...s, restrictedDomains: restricted }) : null;
  await chrome.storage.local.set({
    restrictedDomains: restricted,
    trackedDomains: restricted,
    trackMode: s.trackMode || "selected",
    usageByDay,
    usedSeconds: Math.min(ALLOWANCE_SECONDS, usedSeconds),
    phase,
    phaseEndsAt,
    restrictionDay,
    lastTickAt: now,
    currentDomain: s.enabled ? domain : null
  });
  await syncRules(restricted, phase);
  if (cooldownStarted) {
    notifyCooldown();
    await redirectOpenRestrictedTabs(restricted);
    openBreakPopup();
  }
  await sendStateChanged();
}
function validDomainList(values) {
  if (!Array.isArray(values) || values.length > MAX_RESTRICTED_DOMAINS) throw new Error("Use no more than 50 restricted domains.");
  const normalized = [];
  for (const raw of values) {
    const domain = normalizeHost(raw);
    if (!domain) continue;
    if (domain.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) {
      throw new Error("Invalid domain: " + domain + ". Enter a hostname such as youtube.com, without a URL path.");
    }
    if (!normalized.includes(domain)) normalized.push(domain);
  }
  return normalized;
}
async function configure(settings) {
  const domains = validDomainList(settings.restrictedDomains);
  const trackMode = settings.trackMode === "all" ? "all" : "selected";
  if (trackMode === "selected" && domains.length === 0) throw new Error("Add at least one restricted domain or choose all-website tracking.");
  const current = await state();
  const phase = current.phase === "cooldown" && Date.now() < (Number(current.phaseEndsAt) || 0) ? "cooldown" : "ready";
  await chrome.storage.local.set({
    restrictedDomains: domains,
    trackedDomains: domains,
    trackMode,
    enabled: true,
    phase,
    usedSeconds: phase === "cooldown" ? Math.min(ALLOWANCE_SECONDS, Number(current.usedSeconds) || ALLOWANCE_SECONDS) : (current.restrictionDay === localDayKey() ? Number(current.usedSeconds) || 0 : 0),
    phaseEndsAt: phase === "cooldown" ? Number(current.phaseEndsAt) : 0,
    restrictionDay: localDayKey(),
    lastTickAt: Date.now(),
    currentDomain: null,
    notificationsEnabled: settings.notificationsEnabled !== false,
    usageByDay: pruneHistory(current.usageByDay && typeof current.usageByDay === "object" ? current.usageByDay : {}, localDayKey())
  });
  await syncRules(domains, phase);
  await sendStateChanged();
}
async function pauseTracking() {
  await tick();
  await chrome.storage.local.set({ enabled: false, currentDomain: null, lastTickAt: Date.now() });
  await syncRules([], "ready");
  await sendStateChanged();
}
async function resumeTracking() {
  const s = await state();
  if ((s.trackMode || "selected") === "selected" && !(s.restrictedDomains || s.trackedDomains || []).length) {
    throw new Error("Add at least one restricted domain before resuming selected-site tracking.");
  }
  await chrome.storage.local.set({ enabled: true, lastTickAt: Date.now(), currentDomain: null });
  await syncRules(s.restrictedDomains || s.trackedDomains || [], s.phase === "cooldown" ? "cooldown" : "ready");
  await sendStateChanged();
}
async function clearHistory() {
  await tick();
  await chrome.storage.local.set({ usageByDay: {}, usedSeconds: 0, phase: "ready", phaseEndsAt: 0, restrictionDay: localDayKey(), lastTickAt: Date.now(), currentDomain: null });
  await syncRules([], "ready");
  await sendStateChanged();
}
async function initialize() {
  const s = await state();
  const storedDomains = Array.isArray(s.restrictedDomains) && s.restrictedDomains.length
    ? s.restrictedDomains
    : (Array.isArray(s.trackedDomains) ? s.trackedDomains : []);
  const seedDefaults = storedDomains.length === 0;
  const domains = seedDefaults ? [...DEFAULT_RESTRICTED_DOMAINS] : storedDomains;
  await chrome.storage.local.set({
    restrictedDomains: domains,
    trackedDomains: domains,
    trackMode: s.trackMode || "selected",
    phase: s.phase === "cooldown" && Date.now() < (Number(s.phaseEndsAt) || 0) ? "cooldown" : "ready",
    usedSeconds: Number(s.usedSeconds) || 0,
    phaseEndsAt: Number(s.phaseEndsAt) || 0,
    lastTickAt: Date.now(),
    currentDomain: null,
    usageByDay: s.usageByDay && typeof s.usageByDay === "object" ? s.usageByDay : {},
    enabled: seedDefaults ? true : (typeof s.enabled === "boolean" ? s.enabled : domains.length > 0),
    restrictionDay: s.restrictionDay || localDayKey(),
    notificationsEnabled: s.notificationsEnabled !== false
  });
  const next = await state();
  await syncRules(next.restrictedDomains || [], next.phase);
  chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
}
chrome.runtime.onInstalled.addListener(() => initialize().catch(() => {}));
chrome.runtime.onStartup.addListener(() => initialize().catch(() => {}));
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM) tick().catch(() => {});
});
chrome.tabs.onActivated.addListener(() => tick().catch(() => {}));
chrome.tabs.onUpdated.addListener((id, change, tab) => {
  if (change.url || change.status === "complete") tick().catch(() => {});
});
chrome.windows.onFocusChanged.addListener(() => tick().catch(() => {}));
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") return false;
  const actions = {
    "configure": () => configure(message.settings || {}),
    "pause": () => pauseTracking(),
    "resume": () => resumeTracking(),
    "clear-history": () => clearHistory(),
    "refresh": () => tick()
  };
  if (!actions[message.type]) return false;
  actions[message.type]().then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: error.message || "Action failed." }));
  return true;
});

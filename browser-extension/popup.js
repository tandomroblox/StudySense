const $ = id => document.getElementById(id);
const fmt = seconds => {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  if (n >= 3600) return Math.floor(n / 3600) + "h " + Math.floor((n % 3600) / 60) + "m";
  if (n >= 60) return Math.floor(n / 60) + "m";
  return n + "s";
};
const fmtClock = seconds => {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  return String(Math.floor(n / 60)).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
};
const dayKey = (date) => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
function daysBack(count) {
  const dates = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    dates.push({ key: dayKey(date), label: i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }) });
  }
  return dates;
}
function domainRows(history, days) {
  const totals = {};
  for (const day of days) {
    const entries = history[day.key] || {};
    for (const [domain, seconds] of Object.entries(entries)) totals[domain] = (totals[domain] || 0) + (Number(seconds) || 0);
  }
  return Object.entries(totals).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
}
function totalForDay(day) {
  return Object.values(day || {}).reduce((sum, seconds) => sum + (Number(seconds) || 0), 0);
}
function renderSiteList(element, rows) {
  element.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No usage recorded for this period yet.";
    element.append(empty);
    return;
  }
  const maximum = rows[0][1];
  rows.slice(0, 8).forEach(([domain, seconds]) => {
    const row = document.createElement("div");
    row.className = "site-row";
    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "site-name";
    name.textContent = domain;
    const bar = document.createElement("div");
    bar.className = "site-bar";
    const fill = document.createElement("span");
    fill.style.width = Math.max(2, Math.round(seconds / maximum * 100)) + "%";
    bar.append(fill);
    info.append(name, bar);
    const time = document.createElement("div");
    time.className = "site-time";
    time.textContent = fmt(seconds);
    row.append(info, time);
    element.append(row);
  });
}
function renderHistory(history) {
  const target = $("dailyHistory");
  target.replaceChildren();
  const days = Object.keys(history).sort().reverse().slice(0, 14);
  if (!days.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "History appears after the extension has recorded active browser time.";
    target.append(empty);
    return;
  }
  days.forEach(key => {
    const entries = Object.entries(history[key] || {}).sort((a, b) => b[1] - a[1]);
    const row = document.createElement("div");
    row.className = "history-day";
    const heading = document.createElement("div");
    heading.className = "history-heading";
    const date = new Date(key + "T12:00:00");
    heading.append(document.createElement("span"), document.createElement("span"));
    heading.children[0].textContent = date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    heading.children[1].textContent = fmt(totalForDay(history[key]));
    row.append(heading);
    const desc = document.createElement("p");
    desc.className = "history-domains";
    desc.textContent = entries.length ? entries.slice(0, 8).map(([domain, seconds]) => domain + " " + fmt(seconds)).join(" · ") : "No usage recorded";
    row.append(desc);
    target.append(row);
  });
}
async function send(type, payload) {
  const response = await chrome.runtime.sendMessage({ type, ...(payload || {}) });
  if (!response || !response.ok) throw new Error(response && response.error ? response.error : "The extension could not complete that action.");
  return response;
}
async function refresh() {
  $("refresh").disabled = true;
  const data = await chrome.storage.local.get([
    "restrictedDomains", "trackedDomains", "trackMode", "phase", "usedSeconds",
    "phaseEndsAt", "usageByDay", "enabled", "notificationsEnabled"
  ]);
  const domains = Array.isArray(data.restrictedDomains) ? data.restrictedDomains : (data.trackedDomains || []);
  const mode = data.trackMode === "all" ? "all" : "selected";
  const phase = data.phase === "cooldown" && Number(data.phaseEndsAt) > Date.now() ? "cooldown" : "ready";
  $("domains").value = domains.join("\n");
  $("trackMode").value = mode;
  $("notificationsEnabled").checked = data.notificationsEnabled !== false;
  $("phase").textContent = !data.enabled ? "Tracking paused" : phase === "cooldown" ? "Cooldown active" : domains.length ? "Allowance available" : "Tracking ready";
  const remaining = phase === "cooldown" ? Math.ceil((Number(data.phaseEndsAt) - Date.now()) / 1000) : Math.max(0, 900 - (Number(data.usedSeconds) || 0));
  $("clock").textContent = phase === "cooldown" ? fmtClock(remaining) + " cooldown left" : fmtClock(data.usedSeconds || 0) + " / 15:00 used";
  $("note").textContent = phase === "cooldown" ? "Restricted websites are blocked until the cooldown ends." :
    !data.enabled ? "Resume tracking to collect local site totals and apply restrictions." :
    mode === "all" ? "All website hostnames are tracked while the browser is focused; only listed sites get the cooldown." :
    "Only the domains you listed are tracked and count toward the allowance.";
  $("pause").textContent = data.enabled ? "Pause tracking" : "Resume tracking";
  $("pause").disabled = false;
  const history = data.usageByDay && typeof data.usageByDay === "object" ? data.usageByDay : {};
  const days = daysBack(7);
  const daily = days.map(day => ({ ...day, seconds: totalForDay(history[day.key] || {}) }));
  const weekTotal = daily.reduce((sum, day) => sum + day.seconds, 0);
  const today = daily[daily.length - 1];
  $("todayTotal").textContent = fmt(today ? today.seconds : 0);
  $("weekTotal").textContent = fmt(weekTotal);
  $("siteCount").textContent = String(Object.keys(history[dayKey(new Date())] || {}).filter(key => (history[dayKey(new Date())][key] || 0) > 0).length);
  const bars = $("weekBars");
  bars.replaceChildren();
  const maxDay = Math.max(60, ...daily.map(day => day.seconds));
  daily.forEach(day => {
    const row = document.createElement("div");
    row.className = "day-bar";
    const label = document.createElement("span");
    label.className = "day-label";
    label.textContent = day.label;
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = day.seconds ? Math.max(2, Math.round(day.seconds / maxDay * 100)) + "%" : "0%";
    track.append(fill);
    const value = document.createElement("span");
    value.className = "day-value";
    value.textContent = fmt(day.seconds);
    row.append(label, track, value);
    bars.append(row);
  });
  renderSiteList($("topSites"), domainRows(history, [today || { key: dayKey(new Date()) }]));
  renderSiteList($("topSitesWeek"), domainRows(history, days).slice(0, 8));
  renderHistory(history);
  $("refresh").disabled = false;
}
function parseDomains(text) {
  const output = [];
  const parts = text.split(/[\n,]+/);
  for (const part of parts) {
    let domain = part.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0].replace(/^\*\./, "");
    if (!domain) continue;
    if (domain.includes(":") || domain.includes("?") || domain.includes("#") || domain.includes("@")) throw new Error("Enter domains only (e.g. youtube.com), not full URLs or paths.");
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain)) throw new Error("Invalid domain: " + domain + ".");
    if (!output.includes(domain)) output.push(domain);
  }
  if (output.length > 50) throw new Error("Use no more than 50 restricted domains.");
  return output;
}
$("save").addEventListener("click", async () => {
  const button = $("save");
  button.disabled = true;
  $("message").textContent = "";
  try {
    const restrictedDomains = parseDomains($("domains").value);
    const trackMode = $("trackMode").value;
    if (trackMode === "selected" && restrictedDomains.length === 0) throw new Error("Add at least one restricted domain or choose all-website tracking.");
    const current = await chrome.storage.local.get(["trackMode"]);
    if (trackMode === "all") {
      const hasAll = await chrome.permissions.contains({ origins: ["http://*/*", "https://*/*"] });
      const allowed = hasAll || await chrome.permissions.request({ origins: ["http://*/*", "https://*/*"] });
      if (!allowed) throw new Error("All-site permission was not granted. Nothing was changed.");
    } else {
      const origins = restrictedDomains.flatMap(domain => ["http://" + domain + "/*", "https://" + domain + "/*", "http://*." + domain + "/*", "https://*." + domain + "/*"]);
      const alreadyAllowed = await chrome.permissions.contains({ origins });
      const allowed = alreadyAllowed || await chrome.permissions.request({ origins });
      if (!allowed) throw new Error("Website permission was not granted. Nothing was changed.");
      // Drop broad all-site access only after selected-site access is secured.
      if (current.trackMode === "all") {
        await chrome.permissions.remove({ origins: ["http://*/*", "https://*/*"] });
      }
    }
    await send("configure", { settings: { restrictedDomains, trackMode, notificationsEnabled: $("notificationsEnabled").checked } });
    $("message").textContent = "Saved. Site totals stay in this browser profile.";
    await refresh();
  } catch (error) {
    $("message").textContent = error.message || "Could not save settings.";
  } finally { button.disabled = false; }
});
$("pause").addEventListener("click", async () => {
  $("pause").disabled = true;
  try {
    const s = await chrome.storage.local.get(["enabled"]);
    await send(s.enabled ? "pause" : "resume");
    $("message").textContent = s.enabled ? "Tracking paused. Existing history was kept." : "Tracking resumed.";
    await refresh();
  } catch (error) { $("message").textContent = error.message; }
  finally { $("pause").disabled = false; }
});
$("refresh").addEventListener("click", async () => {
  $("refresh").disabled = true;
  try { await send("refresh"); await refresh(); }
  catch (error) { $("message").textContent = error.message; $("refresh").disabled = false; }
});
$("clear").addEventListener("click", async () => {
  if (!window.confirm("Clear all locally stored site usage history and reset today's restricted-site allowance?")) return;
  $("clear").disabled = true;
  try {
    await send("clear-history");
    $("dataMessage").textContent = "Local usage history cleared.";
    await refresh();
  } catch (error) { $("dataMessage").textContent = error.message; }
  finally { $("clear").disabled = false; }
});
$("export").addEventListener("click", async () => {
  $("export").disabled = true;
  try {
    const data = await chrome.storage.local.get(["usageByDay"]);
    const history = data.usageByDay || {};
    const rows = [["Date", "Domain", "Seconds", "Minutes"]];
    Object.keys(history).sort().forEach(day => {
      Object.entries(history[day] || {}).sort((a, b) => b[1] - a[1]).forEach(([domain, seconds]) => rows.push([day, domain, Number(seconds) || 0, Math.round((Number(seconds) || 0) / 60 * 10) / 10]));
    });
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "studysense-website-usage-" + dayKey(new Date()) + ".csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("dataMessage").textContent = "CSV exported to your device.";
  } catch (error) { $("dataMessage").textContent = error.message; }
  finally { $("export").disabled = false; }
});
chrome.runtime.onMessage.addListener(message => { if (message && message.type === "state-changed") refresh().catch(() => {}); });
refresh().catch(error => { $("message").textContent = error.message || "Could not load usage data."; });

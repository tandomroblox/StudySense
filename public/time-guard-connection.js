(() => {
  const status = document.getElementById("desktopCompanionStatus");
  const detail = document.getElementById("desktopCompanionDetail");
  const apps = document.getElementById("desktopAppUsage");
  const sites = document.getElementById("desktopWebsiteUsage");
  const refresh = document.getElementById("desktopCompanionRefresh");
  if (!status || !detail || !apps || !sites) return;

  const fmt = seconds => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return hours ? hours + "h " + minutes + "m" : minutes + "m";
  };
  const list = (target, entries, labelKey) => {
    target.replaceChildren();
    if (!Array.isArray(entries) || entries.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No activity recorded yet.";
      target.appendChild(li);
      return;
    }
    entries.slice(0, 8).forEach(entry => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = String(entry[labelKey] || "Unknown");
      const time = document.createElement("strong");
      time.textContent = fmt(entry.seconds);
      li.append(name, time);
      target.appendChild(li);
    });
  };

  let requestCounter = 0;
  let pending = null;
  function requestStatus() {
    const nonce = String(Date.now()) + "-" + (++requestCounter);
    status.textContent = "Checking the Desktop Companion…";
    detail.textContent = "This request stays on this device.";
    if (pending) clearTimeout(pending);
    window.postMessage({ type: "studysense-timeguard-status-request", nonce }, location.origin);
    pending = setTimeout(() => {
      status.textContent = "Desktop Companion not detected";
      detail.textContent = "Open StudySense Desktop, then install and enable its companion extension in Chrome or Edge. Activity remains on this device.";
      list(apps, [], "name");
      list(sites, [], "domain");
    }, 1800);
    requestStatus.lastNonce = nonce;
  }

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (!message || message.type !== "studysense-timeguard-status" ||
        typeof message.nonce !== "string" || message.nonce !== requestStatus.lastNonce) return;
    if (pending) clearTimeout(pending);
    const result = message.status || {};
    if (!result.extensionDetected) {
      status.textContent = "Desktop Companion not detected";
      detail.textContent = "Install and enable the companion extension to show local activity.";
      return;
    }
    if (!result.desktopConnected) {
      status.textContent = "Extension detected — desktop app disconnected";
      detail.textContent = "Open StudySense Desktop on this PC. Nothing is being uploaded.";
      list(apps, [], "name");
      list(sites, [], "domain");
      return;
    }
    status.textContent = "Connected to this PC · local activity only";
    const usage = result.usage;
    if (!usage) {
      detail.textContent = "Connected, but no usage snapshot was returned. Try refreshing.";
      list(apps, [], "name");
      list(sites, [], "domain");
      return;
    }
    detail.textContent = "Today (" + String(usage.day || "local date") + "): " +
      fmt(usage.trackedAppSeconds) + " tracked app time and " + fmt(usage.websiteSeconds) +
      " website time. This data was read from the local Desktop Companion.";
    list(apps, usage.apps, "name");
    list(sites, usage.websites, "domain");
  });

  if (refresh) refresh.addEventListener("click", requestStatus);

  async function loadCloudDevices() {
    const cloudStatus = document.getElementById("cloudMonitoringStatus");
    const cloudDevices = document.getElementById("cloudMonitoringDevices");
    if (!cloudStatus || !cloudDevices) return;
    try {
      const response = await fetch("/api/monitoring/devices", { credentials: "same-origin", cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) {
        cloudStatus.textContent = "Sign in to StudySense to view device activity synced to your account.";
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not load device activity.");
      cloudDevices.replaceChildren();
      if (!Array.isArray(data.devices) || data.devices.length === 0) {
        cloudStatus.textContent = "No devices have synced yet. Enable account sync in the Windows or Android companion.";
        return;
      }
      cloudStatus.textContent = "Your account has " + data.devices.length + " connected device(s).";
      for (const device of data.devices) {
        const card = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = (device.device_name || device.platform || "Device") + " · " + String(device.platform || "").toUpperCase();
        const seen = document.createElement("p");
        seen.textContent = "Last sync: " + new Date(device.last_seen_at + "Z").toLocaleString();
        const rows = (data.usage || []).filter(x => x.device_id === device.id).slice(0, 7);
        const summary = document.createElement("p");
        summary.textContent = rows.length ? rows.map(x => x.day + ": " + Math.round(Object.values(x.apps || {}).reduce((a,b)=>a+(Number(b)||0),0)/60) + "m apps, " + Math.round(Object.values(x.websites || {}).reduce((a,b)=>a+(Number(b)||0),0)/60) + "m websites").join(" · ") : "No daily snapshots yet.";
        const unlink = document.createElement("button");
        unlink.type = "button";
        unlink.className = "source-button";
        unlink.textContent = "Unlink device";
        unlink.addEventListener("click", async () => {
          if (!confirm("Unlink this device and delete its synced monitoring history from your StudySense account?")) return;
          const result = await fetch("/api/monitoring/devices/" + encodeURIComponent(device.id), { method: "DELETE", credentials: "same-origin" });
          if (result.ok) loadCloudDevices();
          else cloudStatus.textContent = "Could not unlink this device.";
        });
        card.append(title, seen, summary, unlink);
        cloudDevices.appendChild(card);
      }
    } catch (error) {
      cloudStatus.textContent = error && error.message ? error.message : "Could not load synced device activity.";
    }
  }
  loadCloudDevices();
  requestStatus();
})();

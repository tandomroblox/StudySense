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
  requestStatus();
})();

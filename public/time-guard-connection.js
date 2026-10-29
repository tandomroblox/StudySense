(() => {
  const statusEl = document.getElementById("desktopCompanionStatus");
  const detailEl = document.getElementById("desktopCompanionDetail");
  const refreshButton = document.getElementById("desktopCompanionRefresh");
  if (!statusEl || !detailEl) return;

  let pendingNonce = null;
  let timeoutId = null;

  function showUnavailable() {
    pendingNonce = null;
    statusEl.textContent = "Companion extension not detected";
    detailEl.textContent = "Install or update StudySense Desktop Companion, then refresh this status. This page does not collect your browsing history.";
    if (refreshButton) refreshButton.disabled = false;
  }

  function requestStatus() {
    if (refreshButton) refreshButton.disabled = true;
    pendingNonce = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
    statusEl.textContent = "Checking connection…";
    detailEl.textContent = "Checking the browser extension and local desktop monitor.";
    window.postMessage({ type: "studysense-timeguard-status-request", nonce: pendingNonce }, window.location.origin);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(showUnavailable, 1600);
  }

  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || message.type !== "studysense-timeguard-status" || message.nonce !== pendingNonce) return;
    clearTimeout(timeoutId);
    pendingNonce = null;
    if (refreshButton) refreshButton.disabled = false;

    const data = message.status || {};
    if (!data.extensionDetected) {
      showUnavailable();
      return;
    }
    if (data.desktopConnected) {
      statusEl.textContent = "Desktop Companion connected";
      const apps = Number(data.status?.trackedAppCount || 0);
      const sites = Number(data.status?.restrictedDomains?.length || 0);
      const cooldown = data.status?.cooldownActive ? "Cooldown active" : "No cooldown active";
      detailEl.textContent = "The local desktop monitor is responding. " + sites + " restricted website(s) configured; " + cooldown + ". Usage details remain on your device.";
    } else {
      statusEl.textContent = "Extension detected · Desktop app offline";
      detailEl.textContent = "The browser extension is installed, but it cannot reach the local StudySense Desktop monitor. Open the desktop app to enable combined monitoring. Browser history is not sent to this website.";
    }
  });

  if (refreshButton) refreshButton.addEventListener("click", requestStatus);
  requestStatus();
})();

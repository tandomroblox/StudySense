(() => {
  const ALLOWED_ORIGIN = "https://studysense.studysenseapp.workers.dev";
  if (location.origin !== ALLOWED_ORIGIN) return;

  window.addEventListener("message", async event => {
    if (event.source !== window || event.origin !== ALLOWED_ORIGIN) return;
    const request = event.data;
    if (!request || request.type !== "studysense-timeguard-status-request" || typeof request.nonce !== "string" || request.nonce.length > 100) return;
    try {
      const data = await chrome.runtime.sendMessage({ type: "website-status" });
      window.postMessage({
        type: "studysense-timeguard-status",
        nonce: request.nonce,
        status: { ...(data || {}), extensionDetected: true }
      }, ALLOWED_ORIGIN);
    } catch {
      window.postMessage({
        type: "studysense-timeguard-status",
        nonce: request.nonce,
        status: { extensionDetected: true, desktopConnected: false }
      }, ALLOWED_ORIGIN);
    }
  });
})();

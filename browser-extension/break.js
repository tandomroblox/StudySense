const $ = id => document.getElementById(id);
const formatClock = seconds => {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(n / 3600);
  const minutes = Math.floor((n % 3600) / 60);
  const secs = n % 60;
  return (hours ? String(hours).padStart(2,"0") + ":" : "") + String(minutes).padStart(2,"0") + ":" + String(secs).padStart(2,"0");
};
let phaseEndsAt = 0;
let cooldownExpired = false;
async function refreshBreakState() {
  const data = await chrome.storage.local.get(["phase","phaseEndsAt","restrictedDomains","trackedDomains"]);
  const domains = Array.isArray(data.restrictedDomains) ? data.restrictedDomains : (data.trackedDomains || []);
  phaseEndsAt = Number(data.phaseEndsAt) || 0;
  $("siteSummary").textContent = domains.length ? "Flagged sites: " + domains.join(", ") : "No flagged-site list is currently configured.";
  if (data.phase !== "cooldown" || phaseEndsAt <= Date.now()) {
    $("cooldownStatus").textContent = "The cooldown has ended. Time Guard will refresh the restriction state.";
    updateClock();
    await chrome.runtime.sendMessage({type:"refresh"}).catch(()=>{});
    return;
  }
  updateClock();
}
function updateClock() {
  const remaining = Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
  $("cooldownClock").textContent = formatClock(remaining);
  if (remaining === 0 && !cooldownExpired) {
    cooldownExpired = true;
    $("cooldownStatus").textContent = "Break complete. Refreshing Time Guard now.";
    chrome.runtime.sendMessage({type:"refresh"}).catch(()=>{});
  }
}
$("closeReminder").addEventListener("click", () => window.close());
$("viewUsage").addEventListener("click", async () => {
  try { await chrome.windows.create({url:chrome.runtime.getURL("popup.html"),type:"popup",width:430,height:780,focused:true}); }
  finally { window.close(); }
});
refreshBreakState().catch(() => { $("cooldownStatus").textContent = "Your break has started. Open the Time Guard toolbar button for the latest status."; });
window.setInterval(updateClock, 1000);

"use strict";
const APP_ORIGIN = "https://studysense.studysenseapp.workers.dev";
const view = document.getElementById("workspaceView");
const status = document.getElementById("status");
const tabs = [...document.querySelectorAll(".tab")];
function openRoute(route, selectedTab) {
  view.src = new URL(route, APP_ORIGIN).toString();
  tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab === selectedTab)));
  status.textContent = "StudySense · " + (selectedTab?.textContent || "Account");
}
tabs.forEach(tab => tab.addEventListener("click", () => openRoute(tab.dataset.route, tab)));
document.getElementById("accountTab").addEventListener("click", () => {
  openRoute("/profile.html", null);
  tabs.forEach(tab => tab.setAttribute("aria-selected", "false"));
});
view.addEventListener("did-start-loading", () => { status.textContent = "Loading StudySense…"; });
view.addEventListener("did-stop-loading", () => { status.textContent = "StudySense · Connected workspace"; });
view.addEventListener("did-fail-load", event => {
  if (event.errorCode !== -3) status.textContent = "Could not load StudySense. Check your internet connection and try again.";
});

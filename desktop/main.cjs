"use strict";
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("node:path");
const APP_ORIGIN = "https://studysense.studysenseapp.workers.dev";
let mainWindow;
function isStudySenseUrl(value) {
  try { return new URL(value).origin === APP_ORIGIN; } catch { return false; }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 640,
    backgroundColor: "#0b1020", title: "StudySense", autoHideMenuBar: true, show: false,
    icon: path.join(__dirname, "assets", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: true
    }
  });
  mainWindow.webContents.on("will-attach-webview", (_event, webPreferences, params) => {
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    params.partition = "persist:studysense";
    if (!isStudySenseUrl(params.src || APP_ORIGIN)) params.src = APP_ORIGIN;
  });
  mainWindow.webContents.on("did-attach-webview", (_event, guest) => {
    guest.setWindowOpenHandler(({ url }) => {
      if (!isStudySenseUrl(url)) shell.openExternal(url);
      else guest.loadURL(url);
      return { action: "deny" };
    });
    guest.on("will-navigate", (event, url) => {
      if (!isStudySenseUrl(url)) { event.preventDefault(); shell.openExternal(url); }
    });
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isStudySenseUrl(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

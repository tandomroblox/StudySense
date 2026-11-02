"use strict";
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("studySenseDesktop", Object.freeze({
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0"
}));

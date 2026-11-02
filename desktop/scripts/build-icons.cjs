"use strict";
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");
(async () => {
  const assets = path.join(__dirname, "..", "assets");
  const png = path.join(assets, "icon.png");
  await sharp(path.join(assets, "icon.svg")).resize(256, 256).png().toFile(png);
  fs.writeFileSync(path.join(assets, "icon.ico"), await pngToIco(png));
})().catch(error => { console.error(error); process.exitCode = 1; });

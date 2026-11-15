// Renders build/icon.svg to build/icon.icns, build/icon.ico and build/icon.png (runs on macOS: swift + iconutil).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const svg = path.join(dir, "icon.svg");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rr-icon-"));
const set = path.join(tmp, "icon.iconset");
fs.mkdirSync(set);

// Each size is rendered from the vector source, so small sizes stay sharp.
const render = (px, file) => execFileSync("swift", [path.join(dir, "render-svg.swift"), svg, file, String(px)], { stdio: "inherit" });
for (const s of [16, 32, 128, 256, 512]) {
  render(s, path.join(set, `icon_${s}x${s}.png`));
  render(s * 2, path.join(set, `icon_${s}x${s}@2x.png`));
}
execFileSync("iconutil", ["-c", "icns", set, "-o", path.join(dir, "icon.icns")]);
fs.copyFileSync(path.join(set, "icon_512x512@2x.png"), path.join(dir, "icon.png"));

// Windows .ico: one PNG-compressed image per size (supported since Windows Vista).
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const pngs = icoSizes.map((s) => { const f = path.join(tmp, `ico-${s}.png`); render(s, f); return fs.readFileSync(f); });
const head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let offset = head.length;
pngs.forEach((png, i) => {
  const e = 6 + 16 * i, s = icoSizes[i] % 256; // 256 is stored as 0
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
fs.writeFileSync(path.join(dir, "icon.ico"), Buffer.concat([head, ...pngs]));
fs.rmSync(tmp, { recursive: true, force: true });
console.log("wrote build/icon.icns, build/icon.ico and build/icon.png");

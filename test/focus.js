// Keyboard-focus check, fully offscreen (no window, no Dock icon): Tab through every page in
// light/dark x English/Chinese, force :focus-visible on each stop (an offscreen page never has
// OS focus, so Chromium would not draw the ring), and fail if a stop has no ring or if an
// ancestor with overflow clipping cuts the ring off.
//   npx electron test/focus.js [screenshot-dir]
const fs = require("fs"), os = require("os"), path = require("path");
for (const d of fs.readdirSync(os.tmpdir())) {
  const p = path.join(os.tmpdir(), d);
  try { if (d.startsWith("rr-focus-home-") && Date.now() - fs.statSync(p).mtimeMs > 3600e3) fs.rmSync(p, { recursive: true, force: true }); } catch {}
}
const home = fs.mkdtempSync(path.join(os.tmpdir(), "rr-focus-home-"));
process.env.HOME = home;
const shots = process.argv[2] && !process.argv[2].startsWith("-") ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

const electron = require("electron");
const { app, nativeTheme } = electron;
class Offscreen extends electron.BrowserWindow {
  constructor(o = {}) { super({ ...o, show: false, webPreferences: { ...(o.webPreferences || {}), offscreen: true } }); this.show = () => {}; }
}
const Module = require("module");
const proxied = new Proxy(electron, { get: (t, k) => (k === "BrowserWindow" ? Offscreen : t[k]) });
const load = Module._load;
Module._load = function (req, ...rest) { return req === "electron" ? proxied : load.call(this, req, ...rest); };
app.setPath("userData", path.join(home, "userData"));
if (app.dock) app.dock.hide();
require("../main.js");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
let stops = 0;
const PROBE = `(() => {
  const e = document.activeElement;
  if (!e || e === document.body) return "null";
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  const ring = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
  const out = Math.max(0, parseFloat(s.outlineOffset) + parseFloat(s.outlineWidth));
  let clip = "";
  for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
    const o = getComputedStyle(a);
    if (o.overflow !== "visible" && a !== document.scrollingElement && !a.matches("main")) {
      const b = a.getBoundingClientRect();
      if (r.left - out < b.left || r.top - out < b.top || r.right + out > b.right || r.bottom + out > b.bottom) { clip = a.className || a.tagName; break; }
    }
  }
  return JSON.stringify({ id: (e.id || e.className || e.tagName) + " '" + (e.textContent || "").trim().slice(0, 30) + "'", ring, clip });
})()`;

app.on("browser-window-created", (_e, win) => {
  const wc = win.webContents;
  win.setSize(1100, 760);
  wc.once("did-finish-load", async () => {
    const js = (c) => wc.executeJavaScript(c);
    const dbg = wc.debugger;
    dbg.attach("1.3");
    await dbg.sendCommand("DOM.enable");
    await dbg.sendCommand("CSS.enable");
    let forced = null;
    const force = async () => {
      if (forced) { try { await dbg.sendCommand("CSS.forcePseudoState", { nodeId: forced, forcedPseudoClasses: [] }); } catch {} forced = null; }
      await dbg.sendCommand("DOM.getDocument", { depth: 0 });
      const { result } = await dbg.sendCommand("Runtime.evaluate", { expression: "document.activeElement" });
      if (!result.objectId) return;
      const { nodeId } = await dbg.sendCommand("DOM.requestNode", { objectId: result.objectId });
      if (!nodeId) return;
      await dbg.sendCommand("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: ["focus", "focus-visible"] });
      forced = nodeId;
      await sleep(30);
    };
    const tab = async () => {
      wc.focus();
      wc.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
      wc.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
      await sleep(50);
    };
    try {
      for (const theme of ["light", "dark"]) {
        nativeTheme.themeSource = theme;
        for (const lang of ["en", "zh"]) {
          await js(`localStorage.setItem("lang", "${lang}")`);
          await new Promise((r) => { wc.once("did-finish-load", r); wc.reload(); });
          await sleep(250);
          const views = await js(`[...document.querySelectorAll('#nav button')].map(b => b.dataset.view)`);
          for (const v of views) {
            await js(`document.querySelector('#nav [data-view="${v}"]').click(); document.activeElement.blur()`);
            await sleep(120);
            const seen = new Set();
            for (let i = 0; i < 80; i++) {
              await tab();
              await force();
              const p = JSON.parse((await js(PROBE)) || "null");
              if (!p) continue;
              if (seen.has(p.id)) break;
              seen.add(p.id);
              stops++;
              const where = `${theme}/${lang}/${v}: ${p.id}`;
              if (!p.ring) problems.push(`no focus ring: ${where}`);
              if (p.clip) problems.push(`focus ring clipped by .${p.clip}: ${where}`);
              if (shots && (!p.ring || p.clip)) fs.writeFileSync(path.join(shots, `${theme}-${lang}-${v}-${i}.png`), (await wc.capturePage()).toPNG());
            }
          }
        }
      }
    } catch (e) { problems.push("error: " + (e.stack || e)); }
    const uniq = [...new Set(problems)];
    if (uniq.length) { console.log("FOCUS CHECK FAILED\n" + uniq.join("\n")); app.exit(1); }
    else { console.log(`focus check passed: ${stops} focus stops, light/dark x en/zh, every page, ring visible and unclipped`); app.exit(0); }
  });
});

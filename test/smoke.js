// End-to-end smoke test in real Electron, in both languages: every page renders in the active
// language only, the scorer works, install works (into a temporary HOME, never the real ~/.claude),
// no stray "null", no console errors, no network requests.
//   npx electron test/smoke.js [screenshot-dir]
const fs = require("fs"), os = require("os"), path = require("path");
// Electron writes to the profile folder while quitting, after this script deletes it, so each run can leave
// its folder behind. Sweep earlier runs' folders (ours only, older than an hour) at the start of the next run.
for (const d of fs.readdirSync(os.tmpdir())) {
  const p = path.join(os.tmpdir(), d);
  try { if (d.startsWith("rr-smoke-home-") && Date.now() - fs.statSync(p).mtimeMs > 3600e3) fs.rmSync(p, { recursive: true, force: true }); } catch {}
}
const home = fs.mkdtempSync(path.join(os.tmpdir(), "rr-smoke-home-"));
process.env.HOME = home;
const shots = process.argv[2] && !process.argv[2].startsWith("-") ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

// A fake Claude Code session record (and its project folder) for the Relay page.
const proj = path.join(home, "demo-project");
fs.mkdirSync(proj, { recursive: true });
fs.writeFileSync(path.join(proj, "app.js"), "x\n");
const rec = path.join(home, ".claude", "projects", "-demo-project");
fs.mkdirSync(rec, { recursive: true });
const L = (o) => JSON.stringify({ sessionId: "smoke1", cwd: proj, timestamp: "2026-11-15T10:00:00Z", ...o });
fs.writeFileSync(path.join(rec, "smoke1.jsonl"), [
  L({ type: "user", uuid: "u1", message: { role: "user", content: "Build the demo. Never use tabs." } }),
  L({ type: "assistant", uuid: "a1", message: { model: "m", content: [{ type: "tool_use", id: "t1", name: "Write", input: { file_path: path.join(proj, "app.js") } }] } }),
].join("\n") + "\n");

// Run fully offscreen: no window on screen, no Dock icon. main.js gets a BrowserWindow that never shows.
const electron = require("electron");
const { app, session } = electron;
class Offscreen extends electron.BrowserWindow {
  constructor(o = {}) { super({ ...o, show: false, webPreferences: { ...(o.webPreferences || {}), offscreen: true } }); this.show = () => {}; }
}
const Module = require("module");
const proxied = new Proxy(electron, { get: (t, k) => (k === "BrowserWindow" ? Offscreen : t[k]) });
const load = Module._load;
Module._load = function (req, ...rest) { return req === "electron" ? proxied : load.call(this, req, ...rest); };
if (app.dock) app.dock.hide();
// Fresh profile every run, so a language saved by an earlier run can't leak in.
app.setPath("userData", path.join(home, "userData"));
require("../main.js");

const problems = [];
const requests = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CJK = /[一-鿿]/;

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
    if (!d.url.startsWith("file:") && !d.url.startsWith("devtools:")) requests.push(d.url);
    cb({});
  });
});

app.on("browser-window-created", (_e, win) => {
  const wc = win.webContents;
  wc.on("console-message", (e) => { if (e.level === "error" || e.level === "warning") problems.push(`console ${e.level}: ${e.message}`); });
  wc.once("did-finish-load", async () => {
    const js = (code) => wc.executeJavaScript(code);
    const shot = async (name) => { if (shots) { await sleep(250); fs.writeFileSync(path.join(shots, name + ".png"), (await win.capturePage()).toPNG()); } };
    const visibleText = () => js(`[...document.querySelectorAll('main [data-page]')].filter(p => p.offsetParent !== null).map(p => p.innerText).join('\\n')`);
    // At launch, in either saved language, Overview is open and selected without any click.
    const launchCheck = async (lang) => {
      const n = await js(`[...document.querySelectorAll('[data-page="home"]')].filter(p => p.offsetParent !== null && p.getBoundingClientRect().height > 100).length`);
      const on = await js(`document.querySelector('#nav button.on')?.dataset.view || ''`);
      if (n !== 1 || on !== "home") problems.push(`${lang}: at launch Overview shows ${n} sections, selected nav "${on}"`);
      await shot(`${lang}-launch`);
    };
    try {
      await launchCheck("en");
      await js(`localStorage.setItem("lang", "zh")`);
      await new Promise((r) => { wc.once("did-finish-load", r); wc.reload(); });
      await sleep(200);
      await launchCheck("zh");
      await js(`localStorage.setItem("lang", "en")`);
      await new Promise((r) => { wc.once("did-finish-load", r); wc.reload(); });
      await sleep(200);
      for (const lang of ["en", "zh"]) {
        if (lang === "zh") { await js(`document.querySelector('#lang-toggle').click()`); await sleep(100); }
        const htmlLang = await js(`document.documentElement.lang`);
        if (htmlLang !== (lang === "en" ? "en" : "zh-CN")) problems.push(`${lang}: html lang is ${htmlLang}`);
        const views = await js(`[...document.querySelectorAll('#nav button')].map(b => b.dataset.view)`);
        for (const v of views) {
          await js(`document.querySelector('#nav [data-view="${v}"]').click()`);
          await sleep(v === "files" ? 500 : 200);
          const n = await js(`[...document.querySelectorAll('[data-page="${v}"]')].filter(p => p.offsetParent !== null && p.getBoundingClientRect().height > 100).length`);
          if (n !== 1) problems.push(`${lang}: page ${v} shows ${n} sections`);
          const text = await visibleText();
          if (lang === "en" && CJK.test(text)) problems.push(`en: Chinese text on page ${v}: ${text.match(/.{0,20}[一-鿿].{0,20}/)[0]}`);
          if (lang === "zh" && !CJK.test(text)) problems.push(`zh: page ${v} has no Chinese`);
          if (/\b(null|undefined|NaN)\b/.test(text)) problems.push(`${lang}: stray null/undefined on page ${v}`);
          await shot(`${lang}-${v}`);
        }
        if (lang === "en") {
          const side = await js(`[...document.querySelectorAll('#nav button, #nav .group')].map(b => b.textContent).join(' ')`);
          if (CJK.test(side)) problems.push("en: Chinese in sidebar nav");
        }
        // scorer: 2+2+2+1 = 7 -> good; web mode -> 6/6 good with 3 questions
        await js(`document.querySelector('#nav [data-view="score"]').click(); document.querySelector('#reset').click(); document.querySelector('.seg [data-mode="cc"]').click()`);
        await js(`[2,2,2,1].forEach((v,i) => document.querySelectorAll('#qs .q')[i].querySelectorAll('.opt')[v].click())`);
        const good = lang === "en" ? "Good draw" : "好卡";
        const verdict = await js(`document.querySelector('#verdict').className + '|' + document.querySelector('#verdict b').textContent`);
        if (verdict !== "verdict good|" + good) problems.push(`${lang} scorer cc: ${verdict}`);
        await js(`document.querySelector('.seg [data-mode="web"]').click()`);
        const web = await js(`document.querySelector('#verdict b').textContent + '|' + document.querySelectorAll('#qs .q:not([hidden])').length`);
        if (web !== good + "|3") problems.push(`${lang} scorer web: ${web}`);
        await shot(`${lang}-score-filled`);
        await js(`document.querySelector('#reset').click(); document.querySelector('.seg [data-mode="cc"]').click()`);
        const bad = await js(`[0,0,0,0].forEach((v,i) => document.querySelectorAll('#qs .q')[i].querySelectorAll('.opt')[v].click()); document.querySelector('#verdict').innerText`);
        if (/null|undefined/.test(bad)) problems.push(`${lang}: stray null in bad verdict`);
        // files page: 7 tools with content
        await js(`document.querySelector('#nav [data-view="files"]').click()`);
        await sleep(400);
        const tools = await js(`[...document.querySelectorAll('#tool-list pre')].filter(p => p.textContent.length > 50).length`);
        if (tools !== 7) problems.push(`${lang}: files page shows ${tools} files`);
        // relay: list → preview → create package in the project folder
        await js(`document.querySelector('#nav [data-view="relay"]').click()`);
        await sleep(400);
        const rows = await js(`document.querySelectorAll('#relay-list .sess').length`);
        if (rows !== 1) problems.push(`${lang}: relay lists ${rows} sessions`);
        // search filters the list; the cloud prompt is filled in this language
        const filtered = await js(`(() => { const s = document.querySelector('#relay-search'); s.value = 'zzz-no-such'; s.dispatchEvent(new Event('input')); const n = document.querySelectorAll('#relay-list .sess').length; s.value = 'demo'; s.dispatchEvent(new Event('input')); return n + ',' + document.querySelectorAll('#relay-list .sess').length; })()`);
        if (filtered !== "0,1") problems.push(`${lang}: relay search ${filtered}`);
        const cloud = await js(`document.querySelector('#relay-cloud-prompt').textContent`);
        if (!cloud.includes("RELAY.md") || CJK.test(cloud) !== (lang === "zh")) problems.push(`${lang}: cloud prompt missing or wrong language`);
        await js(`document.querySelector('#relay-list .sess').click()`);
        await sleep(400);
        const stats = await js(`[...document.querySelectorAll('#relay-result .stat b')].map(b => b.textContent).join(',')`);
        if (!stats.startsWith("1,1,0")) problems.push(`${lang}: relay stats ${stats}`);
        await js(`document.querySelector('#relay-result button.primary').click()`);
        await sleep(400);
        await shot(`${lang}-relay-done`);
        const cmds = await js(`[...document.querySelectorAll('#relay-result pre')].map(p => p.textContent)`);
        if (cmds.length !== 3 || !cmds[0].includes('claude "/relay-in"')) problems.push(`${lang}: relay next steps ${JSON.stringify(cmds)}`);
        const resultText = await js(`document.querySelector('#relay-result').innerText`);
        if (lang === "en" && CJK.test(resultText)) problems.push("en: Chinese in relay result");
        if (/\b(null|undefined|NaN)\b/.test(resultText)) problems.push(`${lang}: stray null in relay result`);
        // install into temp HOME; the installed canary must be this language's version
        await js(`document.querySelector('#nav [data-view="install"]').click(); document.querySelector('#btn-plan').click()`);
        await sleep(300);
        await js(`[...document.querySelectorAll('#plan button.primary')].pop().click()`);
        await sleep(300);
        await shot(`${lang}-install-done`);
        const installed = fs.readFileSync(path.join(home, ".claude/skills/canary/SKILL.md"), "utf8");
        if (CJK.test(installed) !== (lang === "zh")) problems.push(`${lang}: installed canary is the wrong language`);
        const doneText = await js(`document.querySelector('#plan').innerText`);
        if (/null|undefined/.test(doneText)) problems.push(`${lang}: stray null after install`);
      }
      const pkgs = fs.readdirSync(path.join(proj, ".relay")).filter((n) => !n.startsWith("."));
      if (pkgs.length !== 2) problems.push(`relay packages written: ${pkgs.length}`);
      const md = fs.readFileSync(path.join(proj, ".relay", pkgs[0], "RELAY.md"), "utf8");
      if (!md.includes("Never use tabs") || !/^## 2 /m.test(md)) problems.push("relay package content");
      // a renderer must not be able to read arbitrary records
      const sneaky = await js(`window.kit.relayPreview('/etc/hosts').then(() => 'read', () => 'refused')`);
      if (sneaky !== "refused") problems.push("relay read an unlisted file");
      // a renderer must not be able to reveal arbitrary paths
      const reveal = await js(`window.kit.reveal('/etc/hosts')`);
      if (reveal !== false) problems.push("reveal accepted an arbitrary path");
    } catch (e) {
      problems.push("exception: " + e.message);
    }
    if (requests.length) problems.push("network requests: " + requests.join(", "));
    console.log(problems.length ? "SMOKE FAILED\n" + problems.join("\n") : "smoke passed: en + zh, all pages, scorer, relay, install, no network");
    fs.rmSync(home, { recursive: true, force: true });
    app.exit(problems.length ? 1 : 0);
  });
});

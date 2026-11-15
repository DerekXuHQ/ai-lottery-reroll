// End-to-end smoke test in real Electron, in both languages: every page renders in the active
// language only, the scorer works, install works (into a temporary HOME, never the real ~/.claude),
// no stray "null", no console errors, no network requests.
//   npx electron test/smoke.js [screenshot-dir]
const fs = require("fs"), os = require("os"), path = require("path");
const home = fs.mkdtempSync(path.join(os.tmpdir(), "rr-smoke-home-"));
process.env.HOME = home;
const shots = process.argv[2] && !process.argv[2].startsWith("-") ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

const { app, session } = require("electron");
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
    try {
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
        // files page: 6 tools with content
        await js(`document.querySelector('#nav [data-view="files"]').click()`);
        await sleep(400);
        const tools = await js(`[...document.querySelectorAll('#tool-list pre')].filter(p => p.textContent.length > 50).length`);
        if (tools !== 6) problems.push(`${lang}: files page shows ${tools} files`);
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
      // a renderer must not be able to reveal arbitrary paths
      const reveal = await js(`window.kit.reveal('/etc/hosts')`);
      if (reveal !== false) problems.push("reveal accepted an arbitrary path");
    } catch (e) {
      problems.push("exception: " + e.message);
    }
    if (requests.length) problems.push("network requests: " + requests.join(", "));
    console.log(problems.length ? "SMOKE FAILED\n" + problems.join("\n") : "smoke passed: en + zh, all pages, scorer, install, no network");
    fs.rmSync(home, { recursive: true, force: true });
    app.exit(problems.length ? 1 : 0);
  });
});

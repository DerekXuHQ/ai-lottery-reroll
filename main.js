const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Menu, session, nativeTheme } = require("electron");
const fs = require("fs");
const path = require("path");
const ops = require("./ops");
const relay = require("./relay");

const NAME = "AI Lottery · Reroll";
const KIT = path.join(__dirname, "kit");
const BG = { light: "#f5f6fa", dark: "#12151e" };
const EXPORT_DIALOG = {
  en: { title: "Choose where to export", buttonLabel: "Export Here" },
  zh: { title: "选择导出位置", buttonLabel: "导出到这里" },
};
const RELAY_DIALOG = {
  en: { pick: "Choose a session record (.jsonl)", folder: "Choose where to put the relay package", here: "Put It Here" },
  zh: { pick: "选择会话记录文件（.jsonl）", folder: "选择接力包放在哪里", here: "放在这里" },
};
// Session records the renderer may ask about: only ones listed by this app or picked by the user.
const readable = new Set();
const built = new Map(); // record path → extracted relay data (kept until the next build of that record)
// Paths the renderer may ask to reveal in Finder: only ones this app itself produced.
const revealable = new Set();

// System menus (Edit, Window, …) stay English; the window content switches language on its own.
app.commandLine.appendSwitch("lang", "en-US");
if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    title: NAME,
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? BG.dark : BG.light,
    // macOS: content under the traffic lights. Windows: normal frame, no menu bar.
    ...(process.platform === "darwin" ? { titleBarStyle: "hiddenInset" } : { autoHideMenuBar: true, icon: path.join(__dirname, "renderer", "logo.png") }),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.once("ready-to-show", () => win.show());
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  // Web links open in the default browser; the app window never navigates away.
  const external = (url) => { if (/^https:\/\//.test(url)) shell.openExternal(url); };
  win.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { e.preventDefault(); external(url); });
  win.on("closed", () => { win = null; });
}

const kit = (lang) => ops.kitFor(KIT, lang);
ipcMain.handle("app:version", () => require("./package.json").version);
ipcMain.handle("kit:files", (_e, lang) => ops.readKit(kit(lang)));
ipcMain.handle("kit:plan", (_e, lang) => ops.installPlan(kit(lang)));
ipcMain.handle("kit:install", (_e, lang) => {
  const r = ops.install(kit(lang));
  for (const it of r.items) revealable.add(path.join(r.target, it.name));
  return r;
});
ipcMain.handle("kit:copy", (_e, text) => { clipboard.writeText(String(text).slice(0, 200000)); return true; });
ipcMain.handle("kit:reveal", (_e, p) => {
  if (!revealable.has(p)) return false;
  shell.showItemInFolder(p);
  return true;
});
ipcMain.handle("kit:export", async (_e, lang) => {
  const r = await dialog.showOpenDialog(win, {
    ...(EXPORT_DIALOG[lang] || EXPORT_DIALOG.en),
    properties: ["openDirectory", "createDirectory"],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const dest = ops.exportKit(kit(lang), r.filePaths[0]);
  revealable.add(dest);
  return dest;
});

const sessionRow = (s) => ({ file: s.file, harness: s.harness, cwd: s.cwd, prompt: s.prompt, spawned: !!s.spawned, mtime: s.mtime, size: s.size, title: s.title || "", last: s.last || "", remote: !!s.remote, profile: s.profile || "" });
ipcMain.handle("relay:list", async () => {
  const list = await relay.listSessionsAsync();
  for (const s of list) readable.add(s.file);
  return list.map(sessionRow);
});
ipcMain.handle("relay:pick", async (_e, lang) => {
  const d = RELAY_DIALOG[lang] || RELAY_DIALOG.en;
  const r = await dialog.showOpenDialog(win, { title: d.pick, properties: ["openFile"], filters: [{ name: "Session record", extensions: ["jsonl"] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  readable.add(r.filePaths[0]);
  return r.filePaths[0];
});
ipcMain.handle("relay:preview", (_e, file) => {
  if (!readable.has(file)) throw new Error("Unknown session record.");
  const r = relay.build(file);
  built.set(file, r);
  return relay.summarize(r);
});
ipcMain.handle("relay:write", async (_e, file, lang, choose) => {
  const r = built.get(file);
  if (!r) throw new Error("Preview the session first.");
  let folder = r.source.cwd;
  if (choose || !folder || !fs.existsSync(folder)) {
    const d = RELAY_DIALOG[lang] || RELAY_DIALOG.en;
    const pick = await dialog.showOpenDialog(win, { title: d.folder, buttonLabel: d.here, properties: ["openDirectory", "createDirectory"] });
    if (pick.canceled || !pick.filePaths[0]) return null;
    folder = pick.filePaths[0];
  }
  const out = relay.writePackage(r, lang === "zh" ? "zh" : "en", folder);
  revealable.add(out.file);
  return { ...out, folder, rel: path.relative(folder, out.file).split(path.sep).join("/") };
});

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  // No network: the spellchecker would otherwise download dictionaries.
  session.defaultSession.setSpellCheckerEnabled(false);
  session.defaultSession.setSpellCheckerLanguages([]);
  // Deny every permission request (camera, notifications, …); the app needs none.
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));
  app.setAboutPanelOptions({
    applicationName: NAME,
    applicationVersion: app.getVersion(),
    copyright: "MIT License",
    credits: "Spot a bad AI session early. Hand the work to a fresh one when it goes dumb.",
    website: "https://github.com/DerekXuHQ/ai-lottery-reroll",
  });
  if (process.platform === "darwin") {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { role: "viewMenu" }, { role: "windowMenu" }]));
  } else {
    Menu.setApplicationMenu(null);
  }
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => app.quit());

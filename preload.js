const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kit", {
  files: (lang) => ipcRenderer.invoke("kit:files", lang),
  plan: (lang) => ipcRenderer.invoke("kit:plan", lang),
  install: (lang) => ipcRenderer.invoke("kit:install", lang),
  copy: (text) => ipcRenderer.invoke("kit:copy", text),
  reveal: (p) => ipcRenderer.invoke("kit:reveal", p),
  platform: process.platform,
  version: () => ipcRenderer.invoke("app:version"),
  relayList: () => ipcRenderer.invoke("relay:list"),
  relayPick: (lang) => ipcRenderer.invoke("relay:pick", lang),
  relayPreview: (file) => ipcRenderer.invoke("relay:preview", file),
  relayWrite: (file, lang, choose) => ipcRenderer.invoke("relay:write", file, lang, !!choose),
  exportKit: (lang) => ipcRenderer.invoke("kit:export", lang),
});

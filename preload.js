const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kit", {
  files: (lang) => ipcRenderer.invoke("kit:files", lang),
  plan: (lang) => ipcRenderer.invoke("kit:plan", lang),
  install: (lang) => ipcRenderer.invoke("kit:install", lang),
  copy: (text) => ipcRenderer.invoke("kit:copy", text),
  reveal: (p) => ipcRenderer.invoke("kit:reveal", p),
  platform: process.platform,
  exportKit: (lang) => ipcRenderer.invoke("kit:export", lang),
});

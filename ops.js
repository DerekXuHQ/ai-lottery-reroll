// File operations for the kit. Pure Node, no Electron, so it can be tested anywhere.
// The kit ships in one folder per language (kit/en, kit/zh); every function takes that folder.
// Safety rules:
//  - Only ever writes the three skill folders inside ~/.claude/skills, or a NEW folder the user picked for export.
//  - Never deletes. Existing same-name skills are moved to ~/.claude/skills-backup/<timestamp>/ first
//    (outside the skills folder, so Claude does not load the backup as skills).
const fs = require("fs");
const path = require("path");
const os = require("os");

const SKILLS = ["canary", "handoff", "pickup"];
const LANGS = ["en", "zh"];
const EXPORT_NAME = "ai-lottery-reroll-kit";

function kitFor(kitRoot, lang) {
  return path.join(kitRoot, LANGS.includes(lang) ? lang : "en");
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p, base));
    else out.push(path.relative(base, p).split(path.sep).join("/"));
  }
  return out.sort();
}

function readKit(kitDir) {
  const files = {};
  for (const rel of listFiles(kitDir)) files[rel] = fs.readFileSync(path.join(kitDir, rel), "utf8");
  return files;
}

function skillsDir(home = os.homedir()) {
  return path.join(home, ".claude", "skills");
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// Same = every file in the kit's skill folder exists in the installed one with identical bytes.
function sameContent(src, dest) {
  try {
    return listFiles(src).every((rel) => fs.readFileSync(path.join(src, rel)).equals(fs.readFileSync(path.join(dest, rel))));
  } catch { return false; }
}

// What install would do, without touching anything.
function installPlan(kitDir, home = os.homedir()) {
  const target = skillsDir(home);
  return {
    target,
    items: SKILLS.map((name) => {
      const dest = path.join(target, name);
      if (!fs.existsSync(dest)) return { name, action: "new" };
      return { name, action: sameContent(path.join(kitDir, "skills", name), dest) ? "same" : "backup" };
    }),
  };
}

function freePath(p) {
  let out = p;
  for (let i = 2; fs.existsSync(out); i++) out = `${p}-${i}`;
  return out;
}

function install(kitDir, home = os.homedir()) {
  const plan = installPlan(kitDir, home);
  const backupRoot = freePath(path.join(home, ".claude", "skills-backup", stamp()));
  fs.mkdirSync(plan.target, { recursive: true });
  const items = plan.items.map((it) => {
    if (it.action === "same") return it;
    const dest = path.join(plan.target, it.name);
    let backupTo;
    if (it.action === "backup") {
      fs.mkdirSync(backupRoot, { recursive: true });
      backupTo = path.join(backupRoot, it.name);
      fs.renameSync(dest, backupTo);
    }
    fs.cpSync(path.join(kitDir, "skills", it.name), dest, { recursive: true, errorOnExist: true, force: false });
    return backupTo ? { ...it, backupTo } : it;
  });
  return { target: plan.target, items };
}

// Copies the kit into a NEW subfolder of the chosen folder. Never overwrites.
function exportKit(kitDir, parentDir) {
  const dest = freePath(path.join(parentDir, EXPORT_NAME));
  fs.cpSync(kitDir, dest, { recursive: true, errorOnExist: true, force: false });
  return dest;
}

module.exports = { SKILLS, LANGS, EXPORT_NAME, kitFor, readKit, installPlan, install, exportKit, skillsDir };

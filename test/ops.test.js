const assert = require("assert"), fs = require("fs"), os = require("os"), path = require("path");
const ops = require("../ops");
const ROOT = path.join(__dirname, "..", "kit");
const KIT = ops.kitFor(ROOT, "en");
const home = fs.mkdtempSync(path.join(os.tmpdir(), "rr-home-"));
const skills = path.join(home, ".claude/skills");

// 0. both languages ship the same file set; unknown language falls back to English
const en = ops.readKit(ops.kitFor(ROOT, "en")), zh = ops.readKit(ops.kitFor(ROOT, "zh"));
assert.deepStrictEqual(Object.keys(en), Object.keys(zh));
assert.strictEqual(ops.kitFor(ROOT, "xx"), ops.kitFor(ROOT, "en"));
assert.ok(Object.keys(en).every((k) => /^[\x20-\x7e]+$/.test(k)), "kit file names must be ASCII");
for (const s of ops.SKILLS) {
  const a = en[`skills/${s}/SKILL.md`], b = zh[`skills/${s}/SKILL.md`];
  assert.match(a, new RegExp(`^---\\nname: ${s}\\n`)); assert.match(b, new RegExp(`^---\\nname: ${s}\\n`));
  assert.match(a, /disable-model-invocation: true/); assert.match(b, /disable-model-invocation: true/);
}
assert.ok(!/[一-鿿]/.test(Object.values(en).join("")), "English kit must not contain Chinese");

// 1. fresh install
let plan = ops.installPlan(KIT, home);
assert.deepStrictEqual(plan.items.map((i) => i.action), ["new", "new", "new"]);
ops.install(KIT, home);
for (const s of ops.SKILLS) assert.ok(fs.existsSync(path.join(skills, s, "SKILL.md")));

// 2. reinstall = all same, nothing written
plan = ops.installPlan(KIT, home);
assert.deepStrictEqual(plan.items.map((i) => i.action), ["same", "same", "same"]);
const r0 = ops.install(KIT, home);
assert.ok(r0.items.every((i) => !i.backupTo));
assert.ok(!fs.existsSync(path.join(home, ".claude/skills-backup")), "no-op reinstall must not create backups");

// 3. user has own different canary + unrelated skill -> backup canary, other untouched
fs.writeFileSync(path.join(skills, "canary/SKILL.md"), "my own");
fs.mkdirSync(path.join(skills, "other"));
fs.writeFileSync(path.join(skills, "other/SKILL.md"), "keep me");
const r = ops.install(KIT, home);
const c = r.items.find((i) => i.name === "canary");
assert.strictEqual(c.action, "backup");
assert.strictEqual(fs.readFileSync(path.join(c.backupTo, "SKILL.md"), "utf8"), "my own");
assert.ok(!c.backupTo.startsWith(skills + path.sep), "backup must be outside skills dir");
assert.strictEqual(fs.readFileSync(path.join(skills, "other/SKILL.md"), "utf8"), "keep me");
assert.strictEqual(fs.readFileSync(path.join(skills, "canary/SKILL.md"), "utf8"), en["skills/canary/SKILL.md"]);

// 4. extra file inside an installed skill folder counts as "same" only if kit files match
fs.writeFileSync(path.join(skills, "pickup/notes.txt"), "user extra");
assert.strictEqual(ops.installPlan(KIT, home).items.find((i) => i.name === "pickup").action, "same");

// 5. two backups in the same second never collide
fs.writeFileSync(path.join(skills, "handoff/SKILL.md"), "v1");
const b1 = ops.install(KIT, home).items.find((i) => i.name === "handoff").backupTo;
fs.writeFileSync(path.join(skills, "handoff/SKILL.md"), "v2");
const b2 = ops.install(KIT, home).items.find((i) => i.name === "handoff").backupTo;
assert.notStrictEqual(b1, b2);
assert.strictEqual(fs.readFileSync(path.join(b1, "SKILL.md"), "utf8"), "v1");
assert.strictEqual(fs.readFileSync(path.join(b2, "SKILL.md"), "utf8"), "v2");

// 6. switching language = the other version is "backup" (old one kept), then installed
const zr = ops.install(ops.kitFor(ROOT, "zh"), home);
assert.ok(zr.items.every((i) => i.action === "backup" && fs.existsSync(i.backupTo)));
assert.strictEqual(fs.readFileSync(path.join(skills, "canary/SKILL.md"), "utf8"), zh["skills/canary/SKILL.md"]);

// 7. export never overwrites, and works under a non-ASCII parent folder
const out = fs.mkdtempSync(path.join(os.tmpdir(), "rr-out-"));
const parent = path.join(out, "导出 测试");
fs.mkdirSync(parent);
const d1 = ops.exportKit(KIT, parent), d2 = ops.exportKit(KIT, parent);
assert.notStrictEqual(d1, d2); assert.ok(d2.endsWith(ops.EXPORT_NAME + "-2"));
assert.ok(fs.existsSync(path.join(d1, "skills/canary/SKILL.md")));

// 8. readKit skips dotfiles
assert.ok(Object.keys(en).every((k) => !k.split("/").some((s) => s.startsWith("."))));

fs.rmSync(home, { recursive: true, force: true });
fs.rmSync(out, { recursive: true, force: true });
console.log(`all ops tests passed: ${Object.keys(en).length} files per language (${ops.LANGS.join(", ")})`);

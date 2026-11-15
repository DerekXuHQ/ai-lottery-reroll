// Relay extraction on synthetic Claude Code and Codex records, in a throwaway folder.
const assert = require("assert"), fs = require("fs"), os = require("os"), path = require("path");
const relay = require("../relay");

const home = fs.mkdtempSync(path.join(os.tmpdir(), "rr-relay-"));
const proj = path.join(home, "work", "demo");          // a git project
const loose = path.join(home, "notes");                 // a folder without git
fs.mkdirSync(path.join(proj, ".git", "refs", "heads"), { recursive: true });
fs.writeFileSync(path.join(proj, ".git", "HEAD"), "ref: refs/heads/main\n");
fs.writeFileSync(path.join(proj, ".git", "refs", "heads", "main"), "0123456789abcdef0123456789abcdef01234567\n");
fs.mkdirSync(loose, { recursive: true });
fs.writeFileSync(path.join(proj, "app.js"), "console.log(1)\n");
fs.writeFileSync(path.join(proj, "CLAUDE.md"), "rules\n");
fs.writeFileSync(path.join(loose, "plan.md"), "plan\n");

const FAKE_APP_PW = ["abcd", "efgh", "ijkl", "mnop"].join("-");
const FAKE_KEY = "sk-" + "A1b2C3d4E5f6G7h8I9j0K1l2M3n4";
const L = (o) => JSON.stringify(o);
const base = { sessionId: "s1", cwd: proj, gitBranch: "main", isSidechain: false };
let t = 0;
const ts = () => new Date(Date.UTC(2026, 10, 15, 10, t++)).toISOString();
const claude = [
  L({ ...base, type: "user", uuid: "u1", timestamp: ts(), message: { role: "user", content: "Build a todo app. Don't use React, keep it vanilla JS." } }),
  L({ ...base, type: "user", uuid: "u2", isMeta: true, timestamp: ts(), message: { role: "user", content: "<system-reminder>ignore me</system-reminder>" } }),
  L({ ...base, type: "assistant", uuid: "a1", timestamp: ts(), message: { model: "claude-x", content: [
    { type: "text", text: "Reading the project first." },
    { type: "tool_use", id: "t1", name: "Read", input: { file_path: path.join(proj, "app.js") } },
    { type: "tool_use", id: "t2", name: "Bash", input: { command: "npm test" } },
    { type: "tool_use", id: "t3", name: "Write", input: { file_path: path.join(proj, "gone.js"), content: "x" } },
    { type: "tool_use", id: "t4", name: "Edit", input: { file_path: path.join(loose, "plan.md") } },
    { type: "tool_use", id: "t5", name: "WebFetch", input: { url: "https://example.com/docs" } },
    { type: "tool_use", id: "t6", name: "TodoWrite", input: { todos: [{ content: "Add filter", status: "in_progress" }, { content: "Setup", status: "completed" }] } },
  ] } }),
  L({ ...base, type: "user", uuid: "u3", timestamp: ts(), message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t2", is_error: true, content: "1 failing" }, { type: "tool_result", tool_use_id: "t1", content: "ok" }] } }),
  L({ ...base, type: "user", uuid: "u4", timestamp: ts(), message: { role: "user", content: `my app password is ${FAKE_APP_PW} and key ${FAKE_KEY}, 密码：hunter22secret` } }),
  L({ ...base, type: "attachment", uuid: "u5", timestamp: ts(), attachment: { type: "queued_command", prompt: "也要支持导出 CSV 等格式", origin: { kind: "human" } } }),
  L({ ...base, type: "user", uuid: "u6", timestamp: ts(), message: { role: "user", content: "<command-name>/compact</command-name>\n<command-args>keep the decisions</command-args>" } }),
  L({ ...base, type: "system", subtype: "compact_boundary", uuid: "c1", timestamp: ts() }),
  L({ ...base, type: "user", uuid: "u7", isCompactSummary: true, timestamp: ts(), message: { role: "user", content: "Summary: todo app, vanilla JS." } }),
  L({ ...base, type: "user", uuid: "u8", isSidechain: true, timestamp: ts(), message: { role: "user", content: "subagent chatter" } }),
  "this line is not json",
  L({ ...base, type: "assistant", uuid: "a2", timestamp: ts(), message: { model: "claude-x", content: [{ type: "text", text: "Filter is half done." }] } }),
];
const cdir = path.join(home, ".claude", "projects", "-work-demo");
fs.mkdirSync(path.join(cdir, "memory"), { recursive: true });
fs.writeFileSync(path.join(cdir, "memory", "MEMORY.md"), "- prefers tabs\n");
const cfile = path.join(cdir, "s1.jsonl");
fs.writeFileSync(cfile, claude.join("\n") + "\n");

// --- Claude Code ---
const r = relay.build(cfile, { home, now: new Date("2026-11-15T12:00:00Z") });
const s = relay.summarize(r);
assert.strictEqual(r.source.tool, "Claude Code");
assert.strictEqual(r.source.cwd, proj);
assert.strictEqual(r.source.model, "claude-x");
assert.deepStrictEqual(r.words.map((w) => w.text.slice(0, 12)), ["Build a todo", "my app passw", "也要支持导出 CSV 等格式".slice(0, 12), "/compact kee"]);
assert.ok(r.words[0].rule, "\"Don't use React\" is a rule");
assert.ok(!r.words.some((w) => /ignore me|subagent chatter|Summary:/.test(w.text)), "meta, sidechain and summary are not user words");
const all = JSON.stringify(r) + relay.render(r, "en") + relay.render(r, "zh");
assert.ok(!all.includes(FAKE_APP_PW) && !all.includes(FAKE_KEY) && !all.includes("hunter22secret"), "secrets must be redacted everywhere");
assert.strictEqual(r.secretsRedacted, 3);
const byName = (n) => r.files.find((f) => f.path.endsWith(n));
assert.strictEqual(byName("app.js").read, 1);
assert.strictEqual(byName("app.js").exists, true);
assert.strictEqual(byName("app.js").repo, proj);
assert.strictEqual(byName("gone.js").exists, false);
assert.strictEqual(byName("plan.md").repo, null, "file outside git");
assert.strictEqual(r.commands.total, 1);
assert.strictEqual(r.commands.failed.length, 1);
assert.deepStrictEqual(r.urls, ["https://example.com/docs"]);
assert.strictEqual(r.source.compactions, 1);
assert.strictEqual(r.source.skippedLines, 1);
assert.strictEqual(r.oldSession.todos.items.length, 2);
assert.match(r.oldSession.summary.text, /vanilla/);
assert.strictEqual(r.oldSession.replies.at(-1).text, "Filter is half done.");
assert.deepStrictEqual(r.baseline.repos.map((b) => [b.root, b.branch, b.commit]), [[proj, "main", "0123456789ab"]]);
assert.strictEqual(r.baseline.outsideGit, 1);
assert.ok(r.context.some((c) => c.path.endsWith("CLAUDE.md")) && r.context.some((c) => c.path.endsWith("MEMORY.md")));
assert.strictEqual(s.missing, 1);

// rendering: both languages, every section, † marks the non-git file
for (const lang of ["en", "zh"]) {
  const md = relay.render(r, lang);
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) assert.match(md, new RegExp(`^## ${n} `, "m"), `${lang}: section ${n}`);
  assert.match(md, /† `[^`]*plan\.md`/);
  assert.match(md, /\[#1\] ★/);
}
const enChrome = relay.render(r, "en").replace(/```[\s\S]*?```/g, "");
assert.ok(!/[一-鿿]/.test(enChrome), "English package text has no Chinese outside quoted user words");

// writing: new folder each time, ignored by git, never overwrites
const p1 = relay.writePackage(r, "en", proj);
const p2 = relay.writePackage(r, "en", proj);
assert.notStrictEqual(p1.dir, p2.dir);
assert.strictEqual(fs.readFileSync(path.join(proj, ".relay", ".gitignore"), "utf8").trim().split("\n").pop(), "*");
assert.ok(fs.existsSync(path.join(p1.dir, "relay.json")) && fs.existsSync(p1.file));

// --- Codex ---
const xdir = path.join(home, ".codex", "sessions", "2026", "11", "15");
fs.mkdirSync(xdir, { recursive: true });
const codex = [
  L({ timestamp: ts(), type: "session_meta", payload: { id: "x1", cwd: loose, git: {} } }),
  L({ timestamp: ts(), type: "turn_context", payload: { cwd: loose, model: "gpt-x" } }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "# AGENTS.md instructions\n<INSTRUCTIONS>…</INSTRUCTIONS>" }] } }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: "Fix the parser, e.g. dates and numbers" }] } }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "function_call", name: "exec_command", call_id: "c1", arguments: JSON.stringify({ cmd: "pytest -q" }) } }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "function_call_output", call_id: "c1", output: "Process exited with code 1" } }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "custom_tool_call", name: "apply_patch", call_id: "c2", input: "*** Begin Patch\n*** Update File: " + path.join(loose, "plan.md") + "\n*** End Patch" } }),
  L({ timestamp: ts(), type: "compacted", payload: {} }),
  L({ timestamp: ts(), type: "response_item", payload: { type: "message", role: "assistant", content: [{ type: "output_text", text: "Dates done." }] } }),
];
const xfile = path.join(xdir, "rollout-2026-11-15T10-00-00-x1.jsonl");
fs.writeFileSync(xfile, codex.join("\n") + "\n");
const x = relay.build(xfile, { home });
assert.strictEqual(x.source.tool, "Codex");
assert.strictEqual(x.source.model, "gpt-x");
assert.deepStrictEqual(x.words.map((w) => w.text), ["Fix the parser, e.g. dates and numbers"]);
assert.strictEqual(x.commands.failed.length, 1);
assert.ok(x.files.some((f) => f.path.endsWith("plan.md") && f.write === 1));
assert.strictEqual(x.source.compactions, 1);
assert.deepStrictEqual(x.baseline.repos, []);

// --- listing ---
const list = relay.listSessions({ home });
assert.deepStrictEqual(list.map((l) => l.harness).sort(), ["claude-code", "codex"]);
assert.strictEqual(list.find((l) => l.harness === "codex").prompt, "Fix the parser, e.g. dates and numbers");
assert.match(list.find((l) => l.harness === "claude-code").prompt, /^Build a todo app/);

fs.rmSync(home, { recursive: true, force: true });
console.log("relay tests passed: Claude Code + Codex extraction, secrets, git/non-git baseline, package, listing");

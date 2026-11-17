// Relay: move the work of a session that has gone dumb into a fresh one.
//
// The old session does not write anything. This module reads the session record that the
// coding tool already keeps on disk, and extracts — by code, with no model involved —
//   1. facts:  files read/written (and whether they still exist), commands and failures, links,
//              environment, the version baseline (git, or file sizes/times when there is no git)
//   2. words:  everything the user typed, verbatim; rules, corrections and preferences marked
//   3. hints:  where the old session thought it was (its last replies, task list, summary) —
//              kept apart and marked low-trust
// The result is RELAY.md (+ relay.json). A fresh session then settles it with the relay-in skill:
// it distills, checks it against the project with its own tools, and asks the user to confirm.
//
// Supported records: Claude Code (~/.claude/projects/<project>/<session>.jsonl) and
// Codex (~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl). Unknown lines are skipped and counted.
// Pure Node: reads files, writes only the new .relay/<time>/ folder. Never runs git or any program.
const fs = require("fs");
const os = require("os");
const path = require("path");

const VERSION = 1;
const LIMITS = { msgChars: 3000, msgHead: 1200, msgTail: 600, replies: 3, replyChars: 1500, summaryChars: 6000, commands: 25, failed: 20, files: 150, urls: 40, headBytes: 2 * 1024 * 1024 };

/* ---------------- secrets ---------------- */
// Session records can hold pasted passwords and keys. Everything that leaves the record passes here.
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "private key"],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/g, "api key"],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/g, "api key"],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}/g, "github token"],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, "slack token"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "aws key"],
  [/\bAIza[0-9A-Za-z_-]{35}\b/g, "google key"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "token"],
  [/\b[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}\b/g, "app password"],
  [/\b(Bearer)\s+[A-Za-z0-9._~+/=-]{16,}/g, "bearer token", 1],
  // label = value: keep the label, hide the value
  [/((?:password|passwd|pwd|passphrase|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|密码|口令|密钥|令牌)\s*["']?\s*[:=：]\s*["']?)([^\s"',;，。]{6,})/gi, "secret", 1],
];
function redact(text) {
  let n = 0;
  let out = String(text);
  for (const [re, label, keep] of SECRET_PATTERNS) {
    out = out.replace(re, (...m) => { n++; return keep ? `${m[1]}${label === "bearer token" ? " " : ""}[redacted ${label}]` : `[redacted ${label}]`; });
  }
  return { text: out, count: n };
}

/* ---------------- helpers ---------------- */
const RULE_LIKE = /(不要|别再|别用|别把|不许|不能|不准|必须|一定要|永远|以后|记住|改成|换成|而不是|应该|我要的|我需要|我希望|不是.{0,20}而是|错了|不对|\bdon'?t\b|\bdo not\b|\bnever\b|\balways\b|\bmust\b|\bshould\b|\binstead\b|\bremember\b|\bfrom now on\b|\bi want\b|\bi need\b|\bstop\b|\bwrong\b)/i;
const clip = (s, n) => (s.length > n ? s.slice(0, n) + ` […${s.length - n} more chars]` : s);
function shorten(s) {
  if (s.length <= LIMITS.msgChars) return s;
  return `${s.slice(0, LIMITS.msgHead)}\n[… ${s.length - LIMITS.msgHead - LIMITS.msgTail} chars omitted; full text in the source record …]\n${s.slice(-LIMITS.msgTail)}`;
}
const isNoise = (t) => !t.trim() || /^\s*</.test(t) || /^\[Request interrupted/.test(t) || /^Caveat: /.test(t) || /^# AGENTS\.md instructions|<INSTRUCTIONS>|<environment_context>/.test(t);
function readLines(file) {
  return fs.readFileSync(file, "utf8").split("\n");
}
function readHead(file) {
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(Math.min(LIMITS.headBytes, fs.fstatSync(fd).size));
    fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.toString("utf8").split("\n").slice(0, -1);
  } finally { fs.closeSync(fd); }
}
const json = (l) => { try { return JSON.parse(l); } catch { return null; } };
const textOf = (content) => typeof content === "string" ? content
  : Array.isArray(content) ? content.filter((c) => c && (c.type === "text" || c.type === "input_text" || c.type === "output_text")).map((c) => c.text || "").join("\n") : "";

function newData(harness, file) {
  return {
    version: VERSION, harness, source: file, sessionId: null, cwd: null, branch: null, model: null, tool: null,
    started: null, ended: null, words: [], replies: [], todos: null, summary: null, compactions: 0,
    files: new Map(), commands: [], urls: new Set(), skipped: 0, lines: 0,
  };
}
function touch(d, p, kind, ts) {
  if (!p || typeof p !== "string") return;
  const f = d.files.get(p) || { path: p, read: 0, write: 0, last: null };
  f[kind === "read" ? "read" : "write"]++;
  f.last = ts || f.last;
  d.files.set(p, f);
}
// A slash command the user typed is recorded as markup; keep it as "/name args".
function slashCommand(text) {
  const name = /<command-name>([^<]+)<\/command-name>/.exec(text);
  if (!name) return null;
  const a = /<command-args>([\s\S]*?)<\/command-args>/.exec(text);
  return (name[1].trim().startsWith("/") ? name[1].trim() : "/" + name[1].trim()) + (a && a[1].trim() ? " " + a[1].trim() : "");
}
function addWord(d, text, ts, ref) {
  const t = (slashCommand(text) || text).trim();
  if (isNoise(t)) return;
  const prev = d.words[d.words.length - 1];
  if (prev && prev.raw === t) return; // the same message recorded twice
  d.words.push({ n: d.words.length + 1, ts, ref, raw: t });
  for (const m of t.matchAll(/@"?((?:\/|~\/)[^"\s]+)"?/g)) touch(d, m[1], "read", ts); // files the user attached
}
const stampTime = (d, ts) => { if (!ts) return; if (!d.started || ts < d.started) d.started = ts; if (!d.ended || ts > d.ended) d.ended = ts; };

/* ---------------- Claude Code ---------------- */
function parseClaude(file) {
  const d = newData("claude-code", file);
  d.tool = "Claude Code";
  const pending = new Map(); // tool_use id → command entry, to attach errors
  for (const line of readLines(file)) {
    if (!line.trim()) continue;
    d.lines++;
    const m = json(line);
    if (!m || typeof m !== "object") { d.skipped++; continue; }
    if (m.isSidechain) continue; // subagents: their work shows up in the main thread's results
    const ts = m.timestamp;
    if (m.sessionId) d.sessionId = m.sessionId;
    if (m.cwd) d.cwd = m.cwd;
    if (m.gitBranch) d.branch = m.gitBranch;
    stampTime(d, ts);
    if (m.type === "user") {
      const c = m.message && m.message.content;
      if (m.isCompactSummary) { d.summary = { text: textOf(c), ts }; continue; }
      if (Array.isArray(c)) for (const x of c) {
        if (x && x.type === "tool_result" && pending.has(x.tool_use_id) && x.is_error) pending.get(x.tool_use_id).failed = true;
      }
      if (!m.isMeta) addWord(d, textOf(c), ts, m.uuid);
    } else if (m.type === "attachment" && m.attachment && m.attachment.type === "queued_command") {
      const a = m.attachment;
      if ((a.origin && a.origin.kind === "human") || a.humanTurn) addWord(d, String(a.prompt || ""), a.timestamp || ts, m.uuid);
    } else if (m.type === "assistant") {
      const msg = m.message || {};
      if (msg.model && !/synthetic/.test(msg.model)) d.model = msg.model;
      for (const x of Array.isArray(msg.content) ? msg.content : []) {
        if (x.type === "text" && x.text && x.text.trim()) d.replies.push({ ts, text: x.text.trim() });
        if (x.type !== "tool_use") continue;
        const inp = x.input || {};
        switch (x.name) {
          case "Read": touch(d, inp.file_path, "read", ts); break;
          case "Write": case "Edit": case "MultiEdit": touch(d, inp.file_path, "write", ts); break;
          case "NotebookEdit": touch(d, inp.notebook_path, "write", ts); break;
          case "Bash": { const c = { ts, cmd: String(inp.command || ""), failed: false }; d.commands.push(c); pending.set(x.id, c); break; }
          case "WebFetch": if (inp.url) d.urls.add(inp.url); break;
          case "TodoWrite": if (Array.isArray(inp.todos)) d.todos = { ts, items: inp.todos.map((t) => ({ status: t.status, text: t.content || t.activeForm || "" })) }; break;
          default: break;
        }
      }
    } else if (m.type === "system" && m.subtype === "compact_boundary") {
      d.compactions++;
    }
  }
  return d;
}

/* ---------------- Codex ---------------- */
function codexPatchFiles(d, patch, ts) {
  for (const m of String(patch).matchAll(/\*\*\* (?:Update|Add|Delete) File: (.+)/g)) touch(d, m[1].trim(), "write", ts);
}
function parseCodex(file) {
  const d = newData("codex", file);
  d.tool = "Codex";
  const pending = new Map();
  for (const line of readLines(file)) {
    if (!line.trim()) continue;
    d.lines++;
    const m = json(line);
    if (!m || typeof m !== "object") { d.skipped++; continue; }
    const p = m.payload || {};
    const ts = m.timestamp || p.timestamp;
    stampTime(d, ts);
    if (m.type === "session_meta") {
      d.sessionId = p.id || p.session_id || d.sessionId;
      d.cwd = p.cwd || d.cwd;
      if (p.git && p.git.branch) d.branch = p.git.branch;
    } else if (m.type === "turn_context") {
      d.cwd = p.cwd || d.cwd;
      d.model = p.model || d.model;
    } else if (m.type === "compacted") {
      d.compactions++;
    } else if (m.type === "response_item") {
      if (p.type === "message" && p.role === "user") addWord(d, textOf(p.content), ts, p.id);
      else if (p.type === "message" && p.role === "assistant") { const t = textOf(p.content).trim(); if (t) d.replies.push({ ts, text: t }); }
      else if (p.type === "function_call") {
        let a = {};
        try { a = JSON.parse(p.arguments || "{}"); } catch { /* keep {} */ }
        if (p.name === "apply_patch") codexPatchFiles(d, a.input || p.arguments, ts);
        const cmd = a.cmd || (Array.isArray(a.command) ? a.command.join(" ") : a.command);
        if (cmd) { const c = { ts, cmd: String(cmd), failed: false }; d.commands.push(c); pending.set(p.call_id, c); }
      } else if (p.type === "custom_tool_call") {
        // apply_patch, or a script that may contain patches and commands
        for (const mm of String(p.input || "").matchAll(/\bcmd\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
          const c = { ts, cmd: mm[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"), failed: false };
          d.commands.push(c); pending.set(p.call_id, c);
        }
        codexPatchFiles(d, p.input, ts);
      } else if (p.type === "function_call_output" || p.type === "custom_tool_call_output") {
        const out = typeof p.output === "string" ? p.output : JSON.stringify(p.output || "");
        if (pending.has(p.call_id) && /exit[_ ]?code["'\s:=]*[1-9]|"success"\s*:\s*false|\bProcess exited with code [1-9]/i.test(out)) pending.get(p.call_id).failed = true;
      }
    }
  }
  return d;
}

/* ---------------- listing ---------------- */
// Listing reads only the start and the end of each record, so thousands of sessions list in about a second.
const LIST_BYTES = 256 * 1024;
function readSlice(file, fromEnd, bytes = LIST_BYTES) {
  const fd = fs.openSync(file, "r");
  try {
    const size = fs.fstatSync(fd).size, len = Math.min(bytes, size), pos = fromEnd ? size - len : 0;
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, pos);
    const lines = buf.toString("utf8").split("\n");
    if (fromEnd && pos > 0) lines.shift(); // cut mid-line
    if (!fromEnd && len < size) lines.pop();
    return lines;
  } finally { fs.closeSync(fd); }
}
const oneLine = (t) => redact(t.trim()).text.replace(/\s+/g, " ").slice(0, 140);
// A person's message in either tool's record, or "" for anything else (tool output, injected context, meta).
function userText(m, harness) {
  let t = "";
  if (harness === "claude-code" && m.type === "user" && !m.isMeta && !m.isCompactSummary && !m.isSidechain) t = textOf(m.message && m.message.content);
  if (harness === "codex" && m.type === "response_item" && m.payload && m.payload.type === "message" && m.payload.role === "user") t = textOf(m.payload.content);
  const shown = slashCommand(t) || t;
  return isNoise(shown) ? "" : shown;
}
// Everything the list needs from one record: folder, first and latest message, and a title the user or a
// session gave it inside the record (/rename, or a name set by the tool that started it).
function peek(file, harness) {
  const out = { prompt: "", last: "", cwd: null, spawned: false, title: "" };
  const head = readSlice(file, false);
  for (const line of head) {
    const m = json(line);
    if (!m) continue;
    if (!out.cwd) out.cwd = harness === "codex" ? (m.payload && m.payload.cwd) || null : m.cwd || null;
    if (m.type === "user" && /^\s*<relay from=/.test(textOf(m.message && m.message.content))) out.spawned = true;
    if (!out.prompt) { const t = userText(m, harness); if (t) out.prompt = oneLine(t); }
    if (m.type === "custom-title" && m.customTitle) out.title = String(m.customTitle);
    else if (m.type === "agent-name" && m.agentName && !out.title) out.title = String(m.agentName);
    if (out.prompt && out.cwd && harness === "codex") break;
  }
  // The end of a long session can be all tool output: look further back once (up to 4 MB) before giving up.
  const size = fs.statSync(file).size;
  let named = "";
  for (const bytes of [LIST_BYTES, 16 * LIST_BYTES]) {
    const tail = size > LIST_BYTES ? readSlice(file, true, bytes) : head;
    for (let i = tail.length - 1; i >= 0; i--) {
      const m = json(tail[i]);
      if (!m) continue;
      if (!named && m.type === "custom-title" && m.customTitle) named = String(m.customTitle);
      if (!out.last) {
        const t = userText(m, harness) || (m.type === "last-prompt" && m.lastPrompt ? m.lastPrompt : "")
          || (harness === "codex" && m.type === "event_msg" && m.payload && m.payload.type === "user_message" && m.payload.message ? m.payload.message : "");
        if (t && !isNoise(t)) out.last = oneLine(t);
      }
      if (out.last && named) break;
    }
    if (out.last || size <= bytes) break;
  }
  if (named) out.title = named;
  out.title = realTitle(out.title);
  return out;
}
function walk(dir, depth, pick, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && depth > 0) walk(p, depth - 1, pick, out);
    else if (e.isFile() && pick(e.name)) out.push(p);
  }
  return out;
}
// Every Claude Code profile on this machine: ~/.claude, ~/.claude-<name> (CLAUDE_CONFIG_DIR profiles)
// and $CLAUDE_CONFIG_DIR itself. Each one keeps its own projects/ folder.
function claudeProfiles(home, env = process.env) {
  const dirs = new Set([path.join(home, ".claude")]);
  try { for (const e of fs.readdirSync(home, { withFileTypes: true })) if (e.isDirectory() && /^\.claude-[\w.-]+$/.test(e.name)) dirs.add(path.join(home, e.name)); } catch { /* unreadable home */ }
  if (env.CLAUDE_CONFIG_DIR) dirs.add(path.resolve(env.CLAUDE_CONFIG_DIR));
  return [...dirs].filter((d) => { try { return fs.statSync(path.join(d, "projects")).isDirectory(); } catch { return false; } })
    .map((d) => ({ dir: d, profile: path.basename(d) === ".claude" ? "" : path.basename(d).replace(/^\.claude-?/, "") || path.basename(d) }));
}
// "New session" / "New session (fork)" is the placeholder before a title is set: no help in picking a session.
const realTitle = (t) => (typeof t === "string" && t.trim() && !/^new session( \(fork\))?$/i.test(t.trim()) ? t.trim().slice(0, 140) : "");
// The Claude desktop app indexes its sessions (Code tab and Remote Control) with the same title you see on
// claude.ai. Read-only; keyed by the CLI session id, which is the record's file name.
function desktopIndex(home, platform = process.platform, env = process.env) {
  const base = platform === "darwin" ? path.join(home, "Library", "Application Support", "Claude", "claude-code-sessions")
    : platform === "win32" ? path.join(env.APPDATA || path.join(home, "AppData", "Roaming"), "Claude", "claude-code-sessions")
    : path.join(env.XDG_CONFIG_HOME || path.join(home, ".config"), "Claude", "claude-code-sessions");
  const map = new Map();
  for (const f of walk(base, 3, (n) => /^local_.*\.json$/.test(n), [])) {
    try {
      const d = JSON.parse(fs.readFileSync(f, "utf8"));
      const v = { title: realTitle(d.title), remote: !!(d.remoteControlSpawn || (Array.isArray(d.bridgeSessionIds) && d.bridgeSessionIds.length)) };
      for (const id of [d.cliSessionId, d.lastAssistantCliSessionId].filter(Boolean)) if (!map.has(id) || v.title) map.set(id, v);
    } catch { /* skip a file being written */ }
  }
  return map;
}
// `claude remote-control` (without the desktop app) keeps one bridge-transcript-cse_<id>.jsonl per web session in
// its profile folder. Its first lines name the local record; titles set through set_session_title name the web
// session (session_<id>, same <id>). Together they give the web title of a Remote Control session.
function bridgeIndex(profileDir) {
  const local = new Map(), titles = new Map();
  const files = walk(profileDir, 0, (n) => /^bridge-transcript-cse_.*\.jsonl$/.test(n), [])
    .map((f) => { try { return { f, t: fs.statSync(f).mtimeMs }; } catch { return null; } }).filter(Boolean).sort((a, b) => a.t - b.t);
  for (const { f } of files) {
    const id = path.basename(f, ".jsonl").replace(/^bridge-transcript-cse_/, "");
    let lines;
    try { lines = fs.readFileSync(f, "utf8").split("\n"); } catch { continue; }
    for (const line of lines) {
      if (!local.has(id)) { const m = /"session_id":"([0-9a-f-]{36})"/.exec(line); if (m) local.set(id, m[1]); }
      if (line.includes("set_session_title")) {
        for (const m of line.matchAll(/"input":\{"session_id":"(?:session_|cse_)?([\w]+)","title":"((?:[^"\\]|\\.)*)"/g)) titles.set(m[1], json(`"${m[2]}"`) || "");
      }
    }
  }
  const out = new Map();
  for (const [id, uuid] of local) out.set(uuid, { title: realTitle(titles.get(id)), remote: true });
  return out;
}
// Codex keeps thread names in session_index.jsonl (latest line wins); record names end in the thread id.
function codexNames(codexHome) {
  const map = new Map();
  try {
    for (const line of fs.readFileSync(path.join(codexHome, "session_index.jsonl"), "utf8").split("\n")) {
      const m = json(line);
      if (m && m.id && m.thread_name) map.set(m.id, realTitle(m.thread_name));
    }
  } catch { /* no index */ }
  return map;
}
// Listing results keyed by file, reused while the file's size and time are unchanged.
const peekCache = new Map();
function cachedPeek(s) {
  const key = s.file, hit = peekCache.get(key);
  if (hit && hit.mtime === s.mtime && hit.size === s.size) return hit.v;
  const v = peek(s.file, s.harness);
  peekCache.set(key, { mtime: s.mtime, size: s.size, v });
  return v;
}
// Every session from both tools and every Claude profile, newest first. The work is split in two so the app can
// yield between chunks (listSessionsAsync) and keep its window responsive during a first scan of thousands.
function sessionStubs({ home, limit, platform, env }) {
  const profiles = claudeProfiles(home, env);
  const claude = profiles.flatMap((p) =>
    walk(path.join(p.dir, "projects"), 1, (n) => n.endsWith(".jsonl"), []).map((f) => ({ file: f, harness: "claude-code", profile: p.profile })));
  const codexHome = env.CODEX_HOME ? path.resolve(env.CODEX_HOME) : path.join(home, ".codex");
  const codex = walk(path.join(codexHome, "sessions"), 3, (n) => /^rollout-.*\.jsonl$/.test(n), []).map((f) => ({ file: f, harness: "codex", profile: "" }));
  const index = desktopIndex(home, platform, env);
  const bridges = new Map();
  for (const p of profiles) for (const [k, v] of bridgeIndex(p.dir)) bridges.set(k, v);
  const names = codexNames(codexHome);
  const stubs = [...claude, ...codex]
    .map((s) => { try { const st = fs.statSync(s.file); return { ...s, mtime: st.mtimeMs, size: st.size }; } catch { return null; } })
    .filter((s) => s && s.size > 0)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
  return { stubs, index, bridges, names };
}
function sessionRow(s, { index, bridges, names }) {
  let f;
  try { f = cachedPeek(s); } catch { f = { prompt: "", last: "", cwd: null, spawned: false, title: "" }; }
  const id = path.basename(s.file, ".jsonl");
  const ix = s.harness === "claude-code" ? index.get(id) || bridges.get(id) : null;
  const codexId = s.harness === "codex" ? (/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(id) || [])[1] : null;
  const title = (ix && ix.title) || f.title || (codexId && names.get(codexId)) || "";
  return { ...s, prompt: f.prompt, last: f.last, spawned: f.spawned, cwd: f.cwd, title, remote: !!(ix && ix.remote) };
}
function listSessions({ home = os.homedir(), limit = Infinity, platform = process.platform, env = process.env } = {}) {
  const ctx = sessionStubs({ home, limit, platform, env });
  return ctx.stubs.map((s) => sessionRow(s, ctx));
}
async function listSessionsAsync({ home = os.homedir(), limit = Infinity, platform = process.platform, env = process.env } = {}) {
  const ctx = sessionStubs({ home, limit, platform, env });
  const out = [];
  for (let i = 0; i < ctx.stubs.length; i++) {
    out.push(sessionRow(ctx.stubs[i], ctx));
    if (i % 40 === 39) await new Promise((r) => setImmediate(r));
  }
  return out;
}

function gitBaseline(cwd) {
  // Read .git directly: running git could pop up a "install developer tools" dialog on a Mac without them.
  let dir = cwd;
  while (dir && dir !== path.dirname(dir)) {
    const g = path.join(dir, ".git");
    if (fs.existsSync(g)) {
      try {
        let gitDir = g;
        if (fs.statSync(g).isFile()) gitDir = path.resolve(dir, fs.readFileSync(g, "utf8").replace(/^gitdir:\s*/, "").trim()); // worktree
        const head = fs.readFileSync(path.join(gitDir, "HEAD"), "utf8").trim();
        const ref = head.startsWith("ref: ") ? head.slice(5) : null;
        let commit = ref ? null : head;
        if (ref) {
          const common = fs.existsSync(path.join(gitDir, "commondir")) ? path.resolve(gitDir, fs.readFileSync(path.join(gitDir, "commondir"), "utf8").trim()) : gitDir;
          for (const base of [gitDir, common]) { try { commit = fs.readFileSync(path.join(base, ref), "utf8").trim(); break; } catch { /* try packed refs */ } }
          if (!commit) { try { const pr = fs.readFileSync(path.join(common, "packed-refs"), "utf8").split("\n").find((l) => l.endsWith(" " + ref)); if (pr) commit = pr.split(" ")[0]; } catch { /* none */ } }
        }
        return { git: true, root: dir, branch: ref ? ref.replace("refs/heads/", "") : "(detached)", commit: commit ? commit.slice(0, 12) : null };
      } catch { return { git: true, root: dir, branch: null, commit: null }; }
    }
    dir = path.dirname(dir);
  }
  return { git: false };
}
function contextFiles(d, home) {
  const out = [];
  const add = (p, why) => { if (p && fs.existsSync(p) && !out.some((x) => x.path === p)) out.push({ path: p, why }); };
  if (d.cwd) for (const n of ["CLAUDE.md", "AGENTS.md", "HANDOFF.md", "README.md"]) add(path.join(d.cwd, n), n === "README.md" ? "project readme" : "project instructions / notes");
  if (d.harness === "claude-code") {
    add(path.join(path.dirname(d.source), "memory", "MEMORY.md"), "auto memory for this project");
    // The record sits in <profile>/projects/<project>/; that profile's own CLAUDE.md applies (~/.claude, ~/.claude-b, …).
    add(path.join(path.dirname(path.dirname(path.dirname(d.source))), "CLAUDE.md"), "user-wide instructions");
  }
  if (d.harness === "codex") add(path.join(home, ".codex", "AGENTS.md"), "user-wide instructions");
  return out;
}

const repoCache = new Map();
function repoOf(dir) {
  if (!dir) return null;
  if (repoCache.has(dir)) return repoCache.get(dir);
  const b = gitBaseline(dir);
  const root = b.git ? b.root : null;
  repoCache.set(dir, root);
  return root;
}

/* ---------------- build ---------------- */
function extract(file, { home = os.homedir(), now = new Date() } = {}) {
  const harness = file.includes(`${path.sep}.codex${path.sep}`) || /rollout-.*\.jsonl$/.test(path.basename(file)) ? "codex" : "claude-code";
  const d = harness === "codex" ? parseCodex(file) : parseClaude(file);
  let secrets = 0;
  const safe = (s) => { const r = redact(s); secrets += r.count; return r.text; };

  const words = d.words.map((w) => {
    const text = shorten(safe(w.raw));
    return { n: w.n, ts: w.ts, ref: w.ref, rule: RULE_LIKE.test(w.raw), text };
  });
  const files = [...d.files.values()]
    .map((f) => {
      const abs = path.isAbsolute(f.path) ? f.path : f.path.startsWith("~/") ? path.join(home, f.path.slice(2)) : path.resolve(d.cwd || home, f.path);
      let st = null;
      try { st = fs.statSync(abs); } catch { /* gone */ }
      return { path: abs, read: f.read, write: f.write, last: f.last, exists: !!st, size: st && st.isFile() ? st.size : null, modified: st ? new Date(st.mtimeMs).toISOString() : null };
    })
    .map((f) => ({ ...f, repo: repoOf(path.dirname(f.path)) }))
    .sort((a, b) => (b.write - a.write) || String(b.last).localeCompare(String(a.last)))
    .slice(0, LIMITS.files);
  const commands = d.commands.map((c) => ({ ts: c.ts, failed: c.failed, cmd: clip(safe(c.cmd).replace(/\s+\n/g, "\n"), 400) }));
  const r = {
    relay: VERSION,
    createdAt: now.toISOString(),
    source: { tool: d.tool, file: d.source, sessionId: d.sessionId, cwd: d.cwd, branchInRecord: d.branch, model: d.model, started: d.started, ended: d.ended, lines: d.lines, skippedLines: d.skipped, compactions: d.compactions },
    baseline: null, // set below, once the files are known
    words,
    files,
    commands: { total: commands.length, failed: commands.filter((c) => c.failed).slice(-LIMITS.failed), last: commands.slice(-LIMITS.commands) },
    urls: [...d.urls].slice(0, LIMITS.urls).map(safe),
    context: contextFiles(d, home),
    oldSession: {
      replies: d.replies.slice(-LIMITS.replies).map((r) => ({ ts: r.ts, text: clip(safe(r.text), LIMITS.replyChars) })),
      todos: d.todos,
      summary: d.summary ? { ts: d.summary.ts, text: clip(safe(d.summary.text), LIMITS.summaryChars) } : null,
    },
  };
  // Version baseline per git repository the session worked in; files outside git are checked by size/time.
  const repos = new Map();
  for (const root of [d.cwd ? repoOf(d.cwd) : null, ...files.filter((f) => f.write).map((f) => f.repo)]) {
    if (root && !repos.has(root)) repos.set(root, gitBaseline(root));
  }
  r.baseline = { repos: [...repos.values()].slice(0, 8), outsideGit: files.filter((f) => !f.repo).length };
  r.secretsRedacted = secrets;
  return r;
}

/* ---------------- RELAY.md ---------------- */
const L = {
  en: {
    title: "RELAY", gen: (n) => `Generated by AI Lottery · Reroll from the session record, by code — no model wrote this file. ${n} secret${n === 1 ? "" : "s"} redacted.`,
    howTitle: "For the new session",
    how: [
      "If you have the `relay-in` skill, run `/relay-in`. Otherwise follow these steps.",
      "1. Read this whole file. If you can start a subagent, let it do steps 1–3 and hand you only HANDOFF.md, so this raw material stays out of your context.",
      "2. Distill it into `HANDOFF.md`: real goal · original vision (quote the user) · confirmed decisions · current state · artifacts and paths · dead ends · user preferences and constraints · open questions · next steps. Cite every item as [#n] (user message) or a file path. A later decision overrides an earlier one; write \"changed from X to Y\" when it does.",
      "3. Check it against the project with your own tools. With git: compare `git status`, `git log`, `git diff` with the baseline below. Without git: compare the files' sizes and times in section 3 with what is on disk now. Whatever you cannot check goes into a \"Manual check\" list.",
      "4. Show the user: the goal in one sentence, a checklist of at most 10 key items, mismatches found, and the manual checks. Wait for confirmation. The user's edits win. Until then, read only; HANDOFF.md is the only file you may write.",
      "Trust order: user's words (2) and facts (3–6) over the old session's notes (7).",
    ],
    s1: "1 Source", s2: "2 What the user said (verbatim)", s2note: "★ = a rule, correction or preference. [#n] = message number, for citing.",
    s3: "3 Files the session touched (checked now)", s4: "4 Commands", s4failed: "Failed", s4last: (n, t) => `Last ${n} of ${t}`, s5: "5 Links", s6: "6 Version baseline",
    s6git: (b) => `- Git repository \`${b.root}\` · branch \`${b.branch}\` · commit \`${b.commit}\` at relay time → compare with git.`,
    s6nogit: (n) => `- ${n} file(s) outside any git repository (marked † in section 3) → compare their size and modified time with section 3; list what can't be checked for the user.`,
    s6none: "No git repository and no files recorded: ask the user how to check the current state.",
    s7: "7 Context files to read", s8: "8 Where the old session thought it was (low trust)", s8note: "Written by the session that went dumb. Use it as a map, check everything.",
    lastReplies: "Last replies", todos: "Last task list", summary: "Last compaction summary",
    cols: ["File", "Read", "Wrote", "Exists now", "Size", "Modified"], yes: "yes", no: "**no**",
    srcRows: (s) => [["Tool", s.tool], ["Session", s.sessionId], ["Record", s.file], ["Working folder", s.cwd], ["Model", s.model], ["Time", `${s.started} → ${s.ended}`], ["Compactions", s.compactions], ["Unreadable lines skipped", s.skippedLines]],
    none: "(none)",
  },
  zh: {
    title: "RELAY", gen: (n) => `由 AI Lottery · Reroll 从会话记录里用代码生成，没有经过任何模型。已打码 ${n} 处密钥/密码。`,
    howTitle: "给新会话",
    how: [
      "有 `relay-in` skill 就运行 `/relay-in`；没有就按下面做。",
      "1. 读完这个文件。能开子代理（subagent）的话，让它做第 1–3 步、只把 HANDOFF.md 交回给你，这样原始材料不进你的上下文。",
      "2. 提炼成 `HANDOFF.md`：真实目标 · 最初的设想（引用用户原话）· 已确认的决定 · 当前状态 · 产物与路径 · 死路 · 用户偏好与约束 · 未决问题 · 下一步。每条都注明出处：[#n]（用户第 n 条消息）或文件路径。后面的决定覆盖前面的，改过的写「原来是 X，后来改成 Y」。",
      "3. 用你自己的工具对照项目核对。有 git：用 `git status`、`git log`、`git diff` 和下面的基线比。没有 git：用第 3 节记录的文件大小和修改时间，和硬盘上现在的比。核对不了的列进「需要你手动核对」。",
      "4. 给用户看：一句话目标、不超过 10 行的要点清单、发现的对不上的地方、需要手动核对的。等用户确认，用户改过的为准。确认前只读，唯一能写的文件是 HANDOFF.md。",
      "可信度：用户原话（第 2 节）和事实（第 3–6 节）高于旧会话的笔记（第 8 节）。",
    ],
    s1: "1 来源", s2: "2 用户说过的话（原文）", s2note: "★ = 规则、纠正或偏好。[#n] = 消息编号，引用时用。",
    s3: "3 会话碰过的文件（现在核对）", s4: "4 命令", s4failed: "失败的", s4last: (n, t) => `最后 ${n} 条（共 ${t} 条）`, s5: "5 链接", s6: "6 版本基线",
    s6git: (b) => `- git 仓库 \`${b.root}\` · 分支 \`${b.branch}\` · 生成时的提交 \`${b.commit}\` → 用 git 对比。`,
    s6nogit: (n) => `- ${n} 个文件不在任何 git 仓库里（第 3 节标 †）→ 对比第 3 节记录的大小和修改时间；核对不了的列给用户。`,
    s6none: "没有 git，也没有记录到文件：问用户怎么核对现状。",
    s7: "7 要读的上下文文件", s8: "8 旧会话以为的进度（低可信）", s8note: "这是变傻的那个会话写的。当地图用，每条都要核对。",
    lastReplies: "最后几条回复", todos: "最后的任务清单", summary: "最后一次压缩摘要",
    cols: ["文件", "读", "写", "现在还在", "大小", "修改时间"], yes: "在", no: "**不在**",
    srcRows: (s) => [["工具", s.tool], ["会话", s.sessionId], ["记录文件", s.file], ["工作目录", s.cwd], ["模型", s.model], ["时间", `${s.started} → ${s.ended}`], ["压缩次数", s.compactions], ["跳过的无法解析行", s.skippedLines]],
    none: "（无）",
  },
};
const fence = (s) => { const n = Math.max(3, ...[...String(s).matchAll(/`{3,}/g)].map((m) => m[0].length + 1)); return "`".repeat(n) + "\n" + s + "\n" + "`".repeat(n); };
const cell = (s) => String(s == null ? "" : s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const size = (b) => b == null ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

function render(r, lang = "en") {
  const T = L[lang] || L.en;
  const name = r.source.cwd ? path.basename(r.source.cwd) : "session";
  const out = [];
  out.push(`# ${T.title} — ${name}  (${r.createdAt.slice(0, 16).replace("T", " ")} UTC)`, "", `> ${T.gen(r.secretsRedacted)}`, "");
  out.push(`## ${T.howTitle}`, "", ...T.how, "");
  out.push(`## ${T.s1}`, "", ...T.srcRows(r.source).map(([k, v]) => `- ${k}: ${v == null || v === "" ? "—" : "`" + v + "`"}`), "");
  out.push(`## ${T.s2}`, "", T.s2note, "");
  for (const w of r.words) out.push(`### [#${w.n}]${w.rule ? " ★" : ""} · ${w.ts ? w.ts.slice(0, 16).replace("T", " ") : ""}`, "", fence(w.text), "");
  if (!r.words.length) out.push(T.none, "");
  out.push(`## ${T.s3}`, "");
  if (r.files.length) {
    out.push(`| ${T.cols.join(" | ")} |`, `|${T.cols.map(() => "---").join("|")}|`);
    for (const f of r.files) out.push(`| ${f.repo ? "" : "† "}\`${cell(f.path)}\` | ${f.read || ""} | ${f.write || ""} | ${f.exists ? T.yes : T.no} | ${size(f.size)} | ${f.modified ? f.modified.slice(0, 19).replace("T", " ") : ""} |`);
  } else out.push(T.none);
  out.push("", `## ${T.s4}`, "");
  if (r.commands.failed.length) out.push(`**${T.s4failed}**`, "", ...r.commands.failed.map((c) => `- \`${cell(c.cmd).slice(0, 300)}\``), "");
  out.push(`**${T.s4last(r.commands.last.length, r.commands.total)}**`, "", ...(r.commands.last.length ? r.commands.last.map((c) => `- ${c.failed ? "✗ " : ""}\`${cell(c.cmd).slice(0, 300)}\``) : [T.none]), "");
  out.push(`## ${T.s5}`, "", ...(r.urls.length ? r.urls.map((u) => `- ${u}`) : [T.none]), "");
  const b6 = [...r.baseline.repos.map(T.s6git), ...(r.baseline.outsideGit ? [T.s6nogit(r.baseline.outsideGit)] : [])];
  out.push(`## ${T.s6}`, "", ...(b6.length ? b6 : [T.s6none]), "");
  out.push(`## ${T.s7}`, "", ...(r.context.length ? r.context.map((c) => `- \`${c.path}\` — ${c.why}`) : [T.none]), "");
  out.push(`## ${T.s8}`, "", `> ${T.s8note}`, "");
  if (r.oldSession.todos) out.push(`### ${T.todos}`, "", ...r.oldSession.todos.items.map((t) => `- [${t.status === "completed" ? "x" : " "}] ${t.text}${t.status === "in_progress" ? " ←" : ""}`), "");
  if (r.oldSession.replies.length) { out.push(`### ${T.lastReplies}`, ""); for (const x of r.oldSession.replies) out.push(fence(x.text), ""); }
  if (r.oldSession.summary) out.push(`### ${T.summary}`, "", fence(r.oldSession.summary.text), "");
  return out.join("\n");
}

/* ---------------- package ---------------- */
const build = extract;
// Writes <folder>/.relay/<time>/RELAY.md + relay.json. The .relay folder ignores itself in git,
// so a package never gets committed by accident.
function writePackage(r, lang, folder) {
  const base = path.join(folder, ".relay");
  fs.mkdirSync(base, { recursive: true });
  const gi = path.join(base, ".gitignore");
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, "# Relay packages may quote private conversations. Keep them out of git.\n*\n");
  const stamp = r.createdAt.replace(/[:.]/g, "-").slice(0, 19);
  let dir = path.join(base, stamp), i = 2;
  while (fs.existsSync(dir)) dir = path.join(base, `${stamp}-${i++}`);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "RELAY.md"), render(r, lang));
  fs.writeFileSync(path.join(dir, "relay.json"), JSON.stringify(r, null, 2));
  return { dir, file: path.join(dir, "RELAY.md") };
}
function summarize(r) {
  return {
    tool: r.source.tool, cwd: r.source.cwd, sessionId: r.source.sessionId, started: r.source.started, ended: r.source.ended,
    words: r.words.length, rules: r.words.filter((w) => w.rule).length, files: r.files.length, missing: r.files.filter((f) => !f.exists).length,
    commands: r.commands.total, failed: r.commands.failed.length, compactions: r.source.compactions, secrets: r.secretsRedacted,
    repos: r.baseline.repos.length, outsideGit: r.baseline.outsideGit, cwdExists: !!(r.source.cwd && fs.existsSync(r.source.cwd)), skipped: r.source.skippedLines,
  };
}

module.exports = { listSessions, listSessionsAsync, build, render, writePackage, summarize, redact, LIMITS };

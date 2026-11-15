"use strict";
// Note: no global named `kit` here — it would shadow the preload's window.kit and stop the script.
const api = window.kit;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  for (const k of kids) if (k != null) el.append(k);
  return el;
};
// replaceChildren() would print a literal "null" for skipped optional children.
const fill = (el, ...kids) => el.replaceChildren(...kids.filter((k) => k != null));
const errText = (e) => (e && e.message ? e.message : String(e));

/* ---------- strings ---------- */
// Prose pages are written per language in index.html; these cover the interactive parts.
// *.html entries are static markup authored here, never user input.
const STR = {
  en: {
    "lang.switch": "中文",
    "nav.home": "Overview", "nav.understand": "UNDERSTAND", "nav.problem": "Problem & evidence", "nav.principle": "Principle & remedy",
    "nav.use": "USE", "nav.flow": "The flow", "nav.score": "Score a session", "nav.clean": "Clean start", "nav.rescue": "When it goes dumb",
    "nav.files": "FILES", "nav.install": "Install", "nav.kit": "Kit & files", "nav.safety": "Safety",
    "score.eyebrow": "SCORE", "score.title": "Score this draw",
    "score.lede": "After sending <code>/canary</code>, pick a score for each answer. The criteria live only here — <b>don't send them to the AI</b>, or it will game the test.",
    "score.env": "Where you're testing", "score.modeCc": "Claude Code (4 questions)", "score.modeWeb": "ChatGPT / web (3 questions)", "score.reset": "Reset",
    "score.pts": (v) => `${v} pt${v === 1 ? "" : "s"}`,
    "score.left": (n) => `${n} to go`, "score.leftTip": "Pick a score for each question.",
    "score.good": "Good draw", "score.mid": "So-so", "score.bad": "Bad draw",
    "score.goodCc": "/rewind to before the test right away, then start real work.", "score.goodWeb": "Edit the first message and replace it with your real task.",
    "score.midTip": "Fine for simple tasks; for important work, close it and start over.", "score.badTip": "Close this session and test a new one.",
    "score.next": "How to start clean →",
    "install.eyebrow": "INSTALL", "install.title": "Install into Claude Code",
    "install.lede": "Installs the <code>canary</code>, <code>handoff</code>, <code>pickup</code> and <code>relay-in</code> skills into <code>~/.claude/skills/</code>, available in every project. All four are manual-only: the AI never invokes them on its own. This installs the English versions; switch the app language to Chinese first to install the Chinese ones.",
    "install.check": "Check install location", "install.where": "Install location: ",
    "install.new": "New", "install.same": "Up to date, skipped", "install.backup": "Exists — back up, then install",
    "install.allSame": "All four skills are already up to date. Nothing to install.",
    "install.backupNote": "Older skills with the same name will be moved to <code>~/.claude/skills-backup/</code>, not deleted.",
    "install.confirm": "Install", "install.done": "Installed. Restart Claude Code and type / to see them.",
    "install.backedUp": "Previous versions backed up to: ", "install.reveal": "Show in folder",
    "install.failed": "Install failed: ", "install.checkFailed": "Check failed: ",
    "install.afterTitle": "After installing",
    "install.after1": "Restart Claude Code and type <code>/</code>. If you see <code>canary</code>, <code>handoff</code>, <code>pickup</code> and <code>relay-in</code>, you're set.",
    "install.after2": "Only want them in one project? Export all files from \"Kit &amp; files\", then copy the folders under <code>skills</code> into that project's <code>.claude/skills/</code>.",
    "files.eyebrow": "KIT & FILES", "files.title": "What's in the kit",
    "files.lede": "View and copy any file directly. To share the kit or drop it into a project, use \"Export all files\".",
    "files.export": "Export all files to a folder…", "files.exported": "Exported to ", "files.exportFailed": "Export failed: ",
    "files.loading": "Loading…", "files.readFailed": "Could not read files: ", "files.missing": "(file missing)",
    "files.what": "What", "files.when": "When", "files.how": "How", "files.view": "View file", "files.copy": "Copy contents",
    "copy.done": "Copied", "copy.failed": "Copy failed",
    "nav.relay": "Relay",
    "relay.eyebrow": "RELAY", "relay.title": "Move the work to a fresh session",
    "relay.lede": "When a session has gone dumb, don't ask it to write its own handoff: it would pass its mistakes on. Your coding tool already keeps a full record of every session on disk. This page reads that record <b>by code</b> and packs what matters for a fresh session to settle.",
    "relay.s1k": "1 · THIS APP", "relay.s1t": "Extract", "relay.s1p": "Pick the session below. The app pulls out everything you said (word for word), the files and commands, and a version baseline, and hides passwords and keys. No model is involved.",
    "relay.s2k": "2 · NEW SESSION", "relay.s2t": "Settle", "relay.s2p": "Open a fresh session and type <code>/relay-in</code>. It distills the package into a one-page <code>HANDOFF.md</code> (in a subagent when it can) and checks it: with git where there is git, by file size and time where there isn't.",
    "relay.s3k": "3 · YOU", "relay.s3t": "Confirm", "relay.s3p": "It shows you the goal and a checklist of at most 10 items. Tick, strike or edit; your edits win. Only then does it start working.",
    "relay.pickTitle": "Sessions on this computer", "relay.refresh": "Refresh", "relay.file": "Choose a record file…",
    "relay.loading": "Reading session records…", "relay.listFailed": "Could not read session records: ",
    "relay.empty": "No Claude Code or Codex sessions found on this computer. ChatGPT and other web chats keep no record here: use the chat prompts on the \"When it goes dumb\" page.",
    "relay.spawned": "started by another session", "relay.noText": "(no text message)",
    "relay.extracting": "Extracting…", "relay.previewFailed": "Could not read this session: ",
    "relay.from": "From", "relay.folder": "Folder", "relay.time": "Time",
    "relay.words": "Your messages", "relay.rules": "rules and corrections", "relay.files": "Files touched", "relay.missing": "missing now",
    "relay.commands": "Commands", "relay.failed": "failed", "relay.compactions": "Compactions", "relay.secrets": "Secrets hidden", "relay.check": "Version check",
    "relay.checkVal": (g, o) => [g ? `${g} git repositor${g === 1 ? "y" : "ies"}` : "", o ? `${o} file${o === 1 ? "" : "s"} by size and time` : ""].filter(Boolean).join(" + ") || "nothing to check: you'll be asked",
    "relay.folderMissing": "This session's folder no longer exists; you'll choose where to put the package.",
    "relay.noWords": "This session has no messages from you (another session started it). The package will hold facts only.",
    "relay.create": "Create relay package", "relay.elsewhere": "Put it somewhere else…",
    "relay.createNote": "Writes one new folder, <code>&lt;project&gt;/.relay/&lt;time&gt;/</code>, holding <code>RELAY.md</code> and <code>relay.json</code>. The <code>.relay</code> folder tells git to ignore it, so a package can't be committed by accident. Nothing else is touched.",
    "relay.created": "Package ready: ", "relay.reveal": "Show in folder", "relay.writeFailed": "Could not write the package: ",
    "relay.nextTitle": "Start the new session",
    "relay.nextCc": "Claude Code: run in a terminal (install <code>relay-in</code> on the Install page first):",
    "relay.nextAny": "Codex, or Claude Code without the skill: first message of the new session:",
    "relay.nextWeb": "ChatGPT or another web chat: upload <code>RELAY.md</code>, then send:",
    "relay.startAny": (rel) => `Read ${rel} and follow its "For the new session" section.`,
    "relay.startWeb": "Follow the \"For the new session\" section of the attached RELAY.md.",
    "relay.whyTitle": "Lossless and distilled: what that means",
    "relay.why": "<p>Think of moving house.</p><ul><li><b>Lossless</b> = every box comes along. Nothing you said is summarized away: all your messages go into the package word for word, and every item points back to where it came from (<code>[#12]</code>, a file path), all the way to the original record.</li><li><b>Distilled</b> = the new session doesn't unpack every box on day one. It reads a one-page <code>HANDOFF.md</code> and opens a box only when it needs something specific. Its context stays clean, so it stays sharp.</li></ul><p><b>Who decides what's useful?</b> In this order: <b>facts</b> (extracted by code; they can't misremember what happened) → <b>your own words</b> (kept verbatim) → <b>a fresh model</b> (distills, but must cite a source for every line) → <b>reality</b> (checked by the new session with its own tools: git where there is git, file size and time where there isn't) → <b>you</b> (a checklist of at most 10 lines; your edits win). The session that went dumb only contributes notes marked low-trust.</p>",
  },
  zh: {
    "lang.switch": "English",
    "nav.home": "概览", "nav.understand": "理解", "nav.problem": "问题与证据", "nav.principle": "原理与对策",
    "nav.use": "使用", "nav.flow": "完整流程", "nav.score": "测卡打分", "nav.clean": "干净开局", "nav.rescue": "变傻急救",
    "nav.files": "文件", "nav.install": "安装", "nav.kit": "工具与文件", "nav.safety": "安全说明",
    "score.eyebrow": "测卡打分", "score.title": "给这张卡打分",
    "score.lede": "在 session 里发完 <code>/canary</code>，对照 AI 的回答点选分数。评分标准只在这里，<b>不要发给 AI</b>，否则它会照着标准应付。",
    "score.env": "使用环境", "score.modeCc": "Claude Code（4 题）", "score.modeWeb": "ChatGPT / 网页版（3 题）", "score.reset": "重新打分",
    "score.pts": (v) => `${v} 分`,
    "score.left": (n) => `还差 ${n} 题`, "score.leftTip": "每题选一个分数。",
    "score.good": "好卡", "score.mid": "一般", "score.bad": "坏卡",
    "score.goodCc": "马上用 /rewind 退回测试之前，开始正事。", "score.goodWeb": "编辑第一条消息，换成你的正事。",
    "score.midTip": "简单任务可以用；重要任务建议关掉重开。", "score.badTip": "关掉这个 session，重开一个再测。",
    "score.next": "怎么干净开局 →",
    "install.eyebrow": "安装", "install.title": "安装到 Claude Code",
    "install.lede": "把 <code>canary</code>、<code>handoff</code>、<code>pickup</code>、<code>relay-in</code> 四个 skill 装到 <code>~/.claude/skills/</code>，所有项目都能用。四个都只能手动触发，AI 不会自己调用。当前安装的是中文版；切换到 English 再安装就是英文版。",
    "install.check": "检查安装位置", "install.where": "安装位置：",
    "install.new": "新装", "install.same": "已是最新，跳过", "install.backup": "已有同名 skill，先备份再装",
    "install.allSame": "四个 skill 都已经是最新版本，不需要再装。",
    "install.backupNote": "同名的旧 skill 会挪到 <code>~/.claude/skills-backup/</code> 下，不会被删除。",
    "install.confirm": "确认安装", "install.done": "安装完成。重启 Claude Code 后输入 / 就能看到。",
    "install.backedUp": "旧版本已备份到：", "install.reveal": "在文件夹中显示",
    "install.failed": "安装失败：", "install.checkFailed": "检查失败：",
    "install.afterTitle": "装好之后",
    "install.after1": "重启 Claude Code，输入 <code>/</code>，能看到 <code>canary</code>、<code>handoff</code>、<code>pickup</code>、<code>relay-in</code> 就装好了。",
    "install.after2": "只想在某个项目里用：在「工具与文件」里导出全部文件，把 <code>skills</code> 下的文件夹复制到那个项目的 <code>.claude/skills/</code>。",
    "files.eyebrow": "工具与文件", "files.title": "包里的文件",
    "files.lede": "每个文件都能直接查看和复制。要给别人或者放进项目，用「导出全部文件」。",
    "files.export": "导出全部文件到文件夹…", "files.exported": "已导出到 ", "files.exportFailed": "导出失败：",
    "files.loading": "读取中…", "files.readFailed": "读取文件失败：", "files.missing": "（文件缺失）",
    "files.what": "做什么", "files.when": "什么时候", "files.how": "怎么用", "files.view": "查看文件内容", "files.copy": "复制内容",
    "copy.done": "已复制", "copy.failed": "复制失败",
    "nav.relay": "接力换会话",
    "relay.eyebrow": "接力", "relay.title": "把工作搬到新会话",
    "relay.lede": "会话变傻了，别让它自己写交接：它会把自己的错误一起交过去。你的编程工具在硬盘上本来就存着每个会话的完整记录。这一页<b>用代码</b>读这份记录，把有用的东西打包，交给新会话接收。",
    "relay.s1k": "1 · 本软件", "relay.s1t": "提取", "relay.s1p": "在下面选会话。软件提取你说过的每一句话（原文）、碰过的文件和命令、版本基线，并把密码和密钥打码。全程不经过任何模型。",
    "relay.s2k": "2 · 新会话", "relay.s2t": "接收", "relay.s2p": "开一个新会话，输入 <code>/relay-in</code>。它把接力包提炼成一页 <code>HANDOFF.md</code>（能用子代理就用子代理），再核对：有 git 用 git，没有 git 就比文件大小和修改时间。",
    "relay.s3k": "3 · 你", "relay.s3t": "确认", "relay.s3p": "它给你看一句话目标和不超过 10 行的清单。你打勾、划掉或修改，以你为准，然后它才开始干活。",
    "relay.pickTitle": "这台电脑上的会话", "relay.refresh": "刷新", "relay.file": "选择记录文件…",
    "relay.loading": "正在读取会话记录…", "relay.listFailed": "读不了会话记录：",
    "relay.empty": "这台电脑上没有找到 Claude Code 或 Codex 的会话。ChatGPT 等网页版不在本机留记录，请用「变傻急救」页的通用版提示词。",
    "relay.spawned": "由其他会话启动", "relay.noText": "（没有文字消息）",
    "relay.extracting": "正在提取…", "relay.previewFailed": "读不了这个会话：",
    "relay.from": "来源", "relay.folder": "目录", "relay.time": "时间",
    "relay.words": "你的消息", "relay.rules": "条规则和纠正", "relay.files": "碰过的文件", "relay.missing": "个现在不在了",
    "relay.commands": "命令", "relay.failed": "条失败", "relay.compactions": "压缩次数", "relay.secrets": "已打码的密钥", "relay.check": "版本核对",
    "relay.checkVal": (g, o) => [g ? `${g} 个 git 仓库` : "", o ? `${o} 个文件按大小和时间` : ""].filter(Boolean).join(" + ") || "没有可核对的：会问你",
    "relay.folderMissing": "这个会话的目录已经不在了，接下来请你选接力包放在哪里。",
    "relay.noWords": "这个会话里没有你说的话（是别的会话启动的），接力包里只有事实。",
    "relay.create": "生成接力包", "relay.elsewhere": "放到别处…",
    "relay.createNote": "只新建一个文件夹 <code>&lt;项目&gt;/.relay/&lt;时间&gt;/</code>，里面是 <code>RELAY.md</code> 和 <code>relay.json</code>。<code>.relay</code> 文件夹自带 git 忽略规则，不会被误提交。别的都不碰。",
    "relay.created": "接力包已生成：", "relay.reveal": "在文件夹中显示", "relay.writeFailed": "写不了接力包：",
    "relay.nextTitle": "开新会话",
    "relay.nextCc": "Claude Code：在终端里运行（先在「安装」页装上 <code>relay-in</code>）：",
    "relay.nextAny": "Codex，或没装 skill 的 Claude Code：新会话的第一条消息：",
    "relay.nextWeb": "ChatGPT 等网页版：上传 <code>RELAY.md</code>，再发送：",
    "relay.startAny": (rel) => `读 ${rel}，按其中「给新会话」一节做。`,
    "relay.startWeb": "按附件 RELAY.md 里「给新会话」一节做。",
    "relay.whyTitle": "「无损」和「蒸馏」是什么意思",
    "relay.why": "<p>可以想成搬家。</p><ul><li><b>无损</b> = 所有箱子都搬过去。你说过的话一句不删，原文进包；每条结论都标着出处（<code>[#12]</code>、文件路径），一直能追到原始记录。</li><li><b>蒸馏</b> = 新会话第一天不把所有箱子都拆开。它先读一页 <code>HANDOFF.md</code>，需要什么再去对应的箱子里拿。上下文干净，它就不容易变傻。</li></ul><p><b>谁来判断什么有用？</b>按这个顺序：<b>事实</b>（代码提取，发生过什么不会记错）→ <b>你的原话</b>（原样保留）→ <b>新模型</b>（负责提炼，但每一条都要注明出处）→ <b>现实</b>（新会话用自己的工具查：有 git 用 git，没有就比文件大小和时间）→ <b>你</b>（不超过 10 行的清单，以你改的为准）。变傻的那个会话只提供标了「低可信」的笔记。</p>",
  },
};

const QUESTIONS = {
  en: [
    { t: "1 · 200 GB CSV", ability: "Spots the unstated constraint?",
      s: ["Loads it all into memory (e.g. plain pd.read_csv)", "Mentions memory but doesn't really handle it", "Chunks / streams it, or uses polars / duckdb"] },
    { t: "2 · stable parameter", ability: "Plays along with a false premise?",
      s: ["Makes up a default value", "Hedges without clearly saying no", "Says there is no such parameter; sort() is already stable"] },
    { t: "3 · VBA macro", ability: "Gets what you actually want?",
      s: ["Only the literal macro", "Mentions in passing it could be more automated", "Macro, plus: the real pain is opening attachments — automate the whole flow"] },
    { t: "4 · Project entry point", ability: "Looks before it speaks?", ccOnly: true,
      s: ["Guesses without reading, or \"generally speaking…\"", "Read some files, but the answer has guesses", "Actually read package.json / pyproject / README etc. first"] },
  ],
  zh: [
    { t: "1 · 200GB CSV", ability: "有没有发现隐含的约束",
      s: ["整个读进内存（如直接 pd.read_csv）", "提到内存问题，但没有真正处理", "分块、流式处理，或用 polars / duckdb"] },
    { t: "2 · stable 参数", ability: "会不会顺着错误前提编",
      s: ["编出一个默认值", "含糊其辞，没有明确否定", "直接指出没有这个参数，sort() 本来就是稳定排序"] },
    { t: "3 · VBA 宏", ability: "懂不懂你真正想要什么",
      s: ["只给字面要求的宏", "顺带提了一句可以更自动化", "给出宏，并点出真正痛点在开附件，提出整个流程自动化"] },
    { t: "4 · 项目入口", ability: "先看再说，还是凭空猜", ccOnly: true,
      s: ["没读文件就猜，或者张口\"一般来说\"", "读了一部分，结论里有猜测", "真的读了 package.json / pyproject / README 等再回答"] },
  ],
};

const TOOLS = {
  en: [
    { path: "skills/canary/SKILL.md", name: "/canary", where: "Claude Code skill", what: "Opening test: 4 small questions", when: "First message of a new session", how: "Type /canary, then score it on the Score page" },
    { path: "skills/handoff/SKILL.md", name: "/handoff", where: "Claude Code skill", what: "Writes the current work into HANDOFF.md: goal, decisions, state, dead ends, preferences, next steps", when: "When a session has gone dumb for good", how: "Type /handoff and check the items it flags" },
    { path: "skills/pickup/SKILL.md", name: "/pickup", where: "Claude Code skill", what: "A new session reads HANDOFF.md, verifies it against git, restates the goal, and waits for your go-ahead", when: "After the new session passes the test and starts clean", how: "Type /pickup" },
    { path: "skills/relay-in/SKILL.md", name: "/relay-in", where: "Claude Code skill", what: "Settles a relay package: distills RELAY.md into HANDOFF.md (in a subagent when possible), checks it with git or file sizes/times, and confirms with you", when: "In a fresh session, after making a package on the Relay page", how: "Type /relay-in" },
    { path: "chat-prompts.md", name: "Chat prompts", where: "Copy and paste", what: "Opening test, handoff, and pickup as three prompts", when: "ChatGPT, Claude on the web, anywhere without skills", how: "Copy the part you need, paste, send" },
    { path: "scoring-rubric.md", name: "Scoring rubric", where: "For your eyes only", what: "The scorer as a document, for sharing or offline use", when: "When the app isn't handy", how: "Score against the table", warn: "Don't send this to the AI. If it sees the criteria, the test only measures how well it games the test." },
    { path: "README.md", name: "README", where: "About the kit", what: "Explains the kit; included when you export it", when: "When giving the kit to someone", how: "Just read it" },
  ],
  zh: [
    { path: "skills/canary/SKILL.md", name: "/canary", where: "Claude Code skill", what: "开局测试，4 道小题", when: "新 session 的第一条消息", how: "输入 /canary，再到「测卡打分」里打分" },
    { path: "skills/handoff/SKILL.md", name: "/handoff", where: "Claude Code skill", what: "把当前工作写成 HANDOFF.md：目标、决定、现状、死路、偏好、下一步", when: "session 变傻、救不回来时", how: "输入 /handoff，核对它列出的不确定项" },
    { path: "skills/pickup/SKILL.md", name: "/pickup", where: "Claude Code skill", what: "新 session 读 HANDOFF.md，用 git 核对后复述目标，等你确认再动手", when: "新 session 测卡通过、干净开局之后", how: "输入 /pickup" },
    { path: "skills/relay-in/SKILL.md", name: "/relay-in", where: "Claude Code skill", what: "接收接力包：把 RELAY.md 提炼成 HANDOFF.md（能用子代理就用），用 git 或文件大小/时间核对，再和你确认", when: "在「接力」页生成接力包后，在新 session 里", how: "输入 /relay-in" },
    { path: "chat-prompts.md", name: "通用版", where: "复制粘贴用", what: "开局测试、交接、接手三段提示词", when: "ChatGPT、Claude 网页版等没有 skill 的地方", how: "复制对应的那一段，粘贴发送" },
    { path: "scoring-rubric.md", name: "评分表", where: "只给你自己看", what: "打分器的文字版，方便给别人或离线看", when: "不方便开本软件时", how: "对照表格打分", warn: "不要发给 AI。它看到评分标准，测出来的就是在应付考试。" },
    { path: "README.md", name: "README", where: "说明", what: "工具包说明，导出给别人时附带", when: "把工具包给别人时", how: "直接阅读" },
  ],
};

/* ---------- language ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode: language just won't persist */ } },
};
let lang = store.get("lang") === "zh" ? "zh" : "en"; // English by default
const t = (key, ...args) => { const v = STR[lang][key] ?? STR.en[key] ?? key; return typeof v === "function" ? v(...args) : v; };

document.documentElement.dataset.platform = (window.kit && window.kit.platform) || "";

function applyLang() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$("[data-i18n-label]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nLabel)));
  $("#lang-toggle").textContent = t("lang.switch");
  buildQuestions();
  $("#plan").replaceChildren();
  $("#export-status").textContent = "";
  filesLoaded = null;
  if (current === "files") loadFiles(); else $("#tool-list").replaceChildren();
  renderRelayList();
  if (relayCurrent) previewRelay(relayCurrent); else $("#relay-result").hidden = true;
}
$("#lang-toggle").addEventListener("click", () => {
  lang = lang === "en" ? "zh" : "en";
  store.set("lang", lang);
  applyLang();
});

/* ---------- navigation ---------- */
let current = "home";
function show(view) {
  current = view;
  $$("[data-page]").forEach((p) => (p.hidden = p.dataset.page !== view));
  $$("#nav button").forEach((b) => {
    const on = b.dataset.view === view;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  $("#main").scrollTop = 0;
  if (view === "files") loadFiles();
  if (view === "relay" && !relayRows) loadRelay();
}
document.addEventListener("click", (e) => {
  const nav = e.target.closest("button[data-view], button[data-go]");
  if (nav) { show(nav.dataset.view || nav.dataset.go); return; }
  const cp = e.target.closest("button[data-copy]");
  if (cp) copy($("#" + cp.dataset.copy).textContent, cp);
});

/* ---------- copy ---------- */
async function copy(text, btn) {
  const old = btn.textContent;
  try { await api.copy(text); btn.textContent = t("copy.done"); } catch { btn.textContent = t("copy.failed"); }
  setTimeout(() => (btn.textContent = old), 1400);
}

/* ---------- scorer ---------- */
const RULES = { cc: { good: 7, mid: 5, tip: "score.goodCc" }, web: { good: 5, mid: 4, tip: "score.goodWeb" } };
let mode = "cc";
const scores = {};
const qBox = $("#qs");

// Built once per language; clicks only toggle classes, so nothing is re-created while scoring.
function buildQuestions() {
  qBox.replaceChildren(...QUESTIONS[lang].map((q, i) => {
    const opts = h("div", { className: "opts" });
    opts.setAttribute("role", "radiogroup");
    opts.setAttribute("aria-label", q.t);
    q.s.forEach((txt, v) => {
      const on = scores[i] === v;
      const o = h("button", { className: "opt s" + v + (on ? " on" : "") }, h("span", { className: "pts", textContent: t("score.pts", v) }), h("span", { className: "txt", textContent: txt }));
      o.setAttribute("role", "radio");
      o.setAttribute("aria-checked", String(on));
      o.addEventListener("click", () => {
        scores[i] = v;
        $$(".opt", opts).forEach((x, k) => { x.classList.toggle("on", k === v); x.setAttribute("aria-checked", String(k === v)); });
        renderVerdict();
      });
      opts.append(o);
    });
    const el = h("div", { className: "q" }, h("div", { className: "q-head" }, h("b", { textContent: q.t }), h("span", { className: "muted", textContent: q.ability })), opts);
    el.dataset.cconly = q.ccOnly ? "1" : "";
    el.hidden = mode === "web" && !!q.ccOnly;
    return el;
  }));
  renderVerdict();
}

function renderVerdict() {
  const active = QUESTIONS.en.map((_, i) => i).filter((i) => !(QUESTIONS.en[i].ccOnly && mode === "web"));
  const done = active.filter((i) => scores[i] !== undefined);
  const total = done.reduce((a, i) => a + scores[i], 0);
  const v = $("#verdict");
  const big = h("span", { className: "big", textContent: total }, h("small", { textContent: " / " + active.length * 2 }));
  let cls = "", title, tip, next = null;
  if (done.length < active.length) {
    title = t("score.left", active.length - done.length); tip = t("score.leftTip");
  } else {
    const r = RULES[mode];
    if (total >= r.good) { cls = "good"; title = t("score.good"); tip = t(r.tip); next = h("button", { textContent: t("score.next") }); next.dataset.go = "clean"; }
    else if (total >= r.mid) { cls = "mid"; title = t("score.mid"); tip = t("score.midTip"); }
    else { cls = "bad"; title = t("score.bad"); tip = t("score.badTip"); }
  }
  v.className = "verdict " + cls;
  fill(v, big, h("div", {}, h("b", { textContent: title }), h("p", { textContent: tip })), next);
}
function setMode(m) {
  mode = m;
  $$(".seg button").forEach((x) => { const on = x.dataset.mode === m; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
  $$(".q", qBox).forEach((q) => (q.hidden = m === "web" && q.dataset.cconly === "1"));
  renderVerdict();
}
$$(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
$("#reset").addEventListener("click", () => {
  for (const k in scores) delete scores[k];
  $$(".opt", qBox).forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
  renderVerdict();
});

/* ---------- files (loaded on first visit, per language) ---------- */
let filesLoaded = null;
function loadFiles() {
  if (filesLoaded) return filesLoaded;
  const list = $("#tool-list");
  const forLang = lang;
  list.replaceChildren(h("p", { className: "muted", textContent: t("files.loading") }));
  filesLoaded = api.files(forLang).then((FILES) => {
    if (forLang !== lang) return;
    list.replaceChildren(...TOOLS[lang].map((tool, i) => {
      const id = "file-" + i;
      const kv = h("dl", { className: "kv" });
      for (const [k, val] of [[t("files.what"), tool.what], [t("files.when"), tool.when], [t("files.how"), tool.how]]) kv.append(h("dt", { textContent: k }), h("dd", { textContent: val }));
      const copyBtn = h("button", { className: "small", textContent: t("files.copy") }); copyBtn.dataset.copy = id;
      return h("article", { className: "tool" },
        h("div", { className: "tool-top" }, h("h3", { textContent: tool.name }), h("span", { className: "where", textContent: tool.path + " · " + tool.where })),
        kv,
        tool.warn ? h("p", { className: "warn", textContent: tool.warn }) : null,
        h("details", {}, h("summary", { textContent: t("files.view") }), h("div", { className: "row-actions" }, copyBtn), h("pre", { className: "file", id, textContent: FILES[tool.path] || t("files.missing") })));
    }));
  }).catch((e) => { filesLoaded = null; list.replaceChildren(h("p", { className: "warn", textContent: t("files.readFailed") + errText(e) })); });
  return filesLoaded;
}

$("#btn-export").addEventListener("click", async (e) => {
  const st = $("#export-status"), btn = e.currentTarget;
  btn.disabled = true;
  try {
    const dest = await api.exportKit(lang);
    st.textContent = dest ? t("files.exported") + dest : "";
    if (dest) api.reveal(dest);
  } catch (err) { st.textContent = t("files.exportFailed") + errText(err); }
  finally { btn.disabled = false; }
});

/* ---------- install ---------- */
const ACTION = { new: ["install.new", "good"], same: ["install.same", "mid"], backup: ["install.backup", "warn"] };
$("#btn-plan").addEventListener("click", async () => {
  const box = $("#plan");
  const forLang = lang;
  let plan;
  try { plan = await api.plan(forLang); } catch (e) { box.replaceChildren(h("p", { className: "warn", textContent: t("install.checkFailed") + errText(e) })); return; }
  const list = h("ul", { className: "planlist" }, ...plan.items.map((it) => {
    const [key, cls] = ACTION[it.action];
    return h("li", {}, h("code", { textContent: it.name }), h("span", { className: "pill " + cls, textContent: t(key) }));
  }));
  box.replaceChildren(h("p", {}, t("install.where"), h("code", { textContent: plan.target })), list);
  if (plan.items.every((it) => it.action === "same")) { box.append(h("p", { className: "okmsg", textContent: t("install.allSame") })); return; }
  if (plan.items.some((it) => it.action === "backup")) box.append(h("p", { className: "muted", innerHTML: t("install.backupNote") }));
  const go = h("button", { className: "primary", textContent: t("install.confirm") });
  const row = h("div", { className: "row-actions" }, go);
  box.append(row);
  go.addEventListener("click", async () => {
    go.disabled = true;
    try {
      const r = await api.install(forLang);
      const backups = r.items.filter((x) => x.backupTo).map((x) => x.backupTo);
      const rv = h("button", { className: "small", textContent: t("install.reveal") });
      rv.addEventListener("click", () => api.reveal(r.target + "/canary"));
      fill(row, h("p", { className: "okmsg", textContent: t("install.done") }),
        backups.length ? h("p", { className: "muted", textContent: t("install.backedUp") + backups.join(", ") }) : null, rv);
    } catch (e) {
      go.disabled = false;
      row.append(h("p", { className: "warn", textContent: t("install.failed") + errText(e) }));
    }
  });
});

/* ---------- relay ---------- */
// Lists sessions on first visit; picking one extracts it (by code, in the main process) and shows what's in it.
let relayRows = null, relayCurrent = null;
const isWin = /^win/.test((api && api.platform) || "");
const ago = (ms) => {
  const rtf = new Intl.RelativeTimeFormat(lang === "zh" ? "zh-CN" : "en", { numeric: "auto" });
  const m = Math.round((ms - Date.now()) / 60000);
  return Math.abs(m) < 60 ? rtf.format(m, "minute") : Math.abs(m) < 2880 ? rtf.format(Math.round(m / 60), "hour") : rtf.format(Math.round(m / 1440), "day");
};
const mb = (b) => (b / 1048576 >= 1 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const tail = (p) => (p ? p.split(/[\\/]/).filter(Boolean).slice(-2).join("/") : "—");
const TOOL = { "claude-code": "Claude Code", codex: "Codex" };

function renderRelayList() {
  const box = $("#relay-list");
  if (!relayRows) return;
  if (!relayRows.length) { box.replaceChildren(h("p", { className: "muted", textContent: t("relay.empty") })); return; }
  box.replaceChildren(...relayRows.map((r) => {
    const b = h("button", { className: "sess" + (relayCurrent === r.file ? " on" : "") },
      h("span", { className: "pill " + (r.harness === "codex" ? "mid" : "good"), textContent: TOOL[r.harness] }),
      h("span", { className: "sess-main" },
        h("b", { textContent: tail(r.cwd) }),
        h("span", { className: "muted", textContent: r.prompt || (r.spawned ? t("relay.spawned") : t("relay.noText")) })),
      h("span", { className: "sess-meta muted", textContent: `${ago(r.mtime)} · ${mb(r.size)}` }));
    b.setAttribute("role", "listitem");
    b.title = r.file;
    b.addEventListener("click", () => previewRelay(r.file));
    return b;
  }));
}
async function loadRelay() {
  const box = $("#relay-list");
  box.replaceChildren(h("p", { className: "muted", textContent: t("relay.loading") }));
  try { relayRows = await api.relayList(); renderRelayList(); }
  catch (e) { relayRows = null; box.replaceChildren(h("p", { className: "warn", textContent: t("relay.listFailed") + errText(e) })); }
}
async function previewRelay(file) {
  relayCurrent = file;
  renderRelayList();
  const out = $("#relay-result");
  out.hidden = false;
  out.replaceChildren(h("p", { className: "muted", textContent: t("relay.extracting") }));
  let s;
  try { s = await api.relayPreview(file); } catch (e) { out.replaceChildren(h("p", { className: "warn", textContent: t("relay.previewFailed") + errText(e) })); return; }
  if (relayCurrent !== file) return;
  const kv = h("dl", { className: "kv wide" });
  const row = (k, v) => kv.append(h("dt", { textContent: k }), h("dd", {}, ...[].concat(v)));
  row(t("relay.from"), `${s.tool} · ${s.sessionId || ""}`);
  row(t("relay.folder"), h("code", { textContent: s.cwd || "—" }));
  row(t("relay.time"), `${(s.started || "").slice(0, 16).replace("T", " ")} → ${(s.ended || "").slice(0, 16).replace("T", " ")}`);
  const stats = h("div", { className: "stats" },
    ...[[t("relay.words"), s.words, s.rules ? `★ ${s.rules} ${t("relay.rules")}` : ""],
      [t("relay.files"), s.files, s.missing ? `${s.missing} ${t("relay.missing")}` : ""],
      [t("relay.commands"), s.commands, s.failed ? `${s.failed} ${t("relay.failed")}` : ""],
      [t("relay.compactions"), s.compactions, ""],
      [t("relay.secrets"), s.secrets, ""]]
      .map(([k, n, sub]) => h("div", { className: "stat" }, h("span", { className: "muted", textContent: k }), h("b", { textContent: String(n) }), sub ? h("small", { textContent: sub }) : null)));
  const check = h("p", {}, h("span", { className: "muted", textContent: t("relay.check") + ": " }), t("relay.checkVal", s.repos, s.outsideGit));
  const go = h("button", { className: "primary", textContent: t("relay.create") });
  const other = h("button", { className: "small", textContent: t("relay.elsewhere") });
  const actions = h("div", { className: "row-actions" }, go, other);
  const done = h("div");
  fill(out, kv, stats, check,
    !s.cwdExists ? h("p", { className: "warn", textContent: t("relay.folderMissing") }) : null,
    !s.words ? h("p", { className: "warn", textContent: t("relay.noWords") }) : null,
    h("p", { className: "muted", innerHTML: t("relay.createNote") }), actions, done);
  const write = async (choose) => {
    go.disabled = other.disabled = true;
    try {
      const r = await api.relayWrite(file, lang, choose);
      if (!r) return;
      const rv = h("button", { className: "small", textContent: t("relay.reveal") });
      rv.addEventListener("click", () => api.reveal(r.file));
      const q = (x) => `"${x}"`;
      const blocks = [
        ["relay.nextCc", `cd ${q(r.folder)}${isWin ? "; " : " && "}claude "/relay-in"`],
        ["relay.nextAny", t("relay.startAny", r.rel)],
        ["relay.nextWeb", t("relay.startWeb")],
      ].map(([label, cmd], i) => {
        const id = "relay-cmd-" + i;
        const c = h("button", { className: "small", textContent: t("files.copy") }); c.dataset.copy = id;
        return h("div", { className: "cmd" }, h("p", { innerHTML: t(label) }), h("div", { className: "cmd-row" }, h("pre", { className: "file", id, textContent: cmd }), c));
      });
      fill(done, h("p", { className: "okmsg" }, t("relay.created"), h("code", { textContent: r.file })), rv, h("h3", { textContent: t("relay.nextTitle") }), ...blocks);
    } catch (e) {
      done.replaceChildren(h("p", { className: "warn", textContent: t("relay.writeFailed") + errText(e) }));
    } finally { go.disabled = other.disabled = false; }
  };
  go.addEventListener("click", () => write(false));
  other.addEventListener("click", () => write(true));
}
$("#relay-refresh").addEventListener("click", loadRelay);
$("#relay-file").addEventListener("click", async () => {
  const f = await api.relayPick(lang);
  if (f) { relayRows = [{ file: f, harness: /rollout-/.test(f) ? "codex" : "claude-code", cwd: null, prompt: f, mtime: Date.now(), size: 0 }, ...(relayRows || []).filter((r) => r.file !== f)]; previewRelay(f); }
});

applyLang();
setMode("cc");

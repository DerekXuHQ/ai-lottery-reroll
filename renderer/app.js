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
    "copy.done": "Copied", "copy.failed": "Copy failed", "copy.btn": "Copy",
    "nav.relay": "Relay",
    "relay.eyebrow": "RELAY", "relay.title": "Move the work to a fresh session",
    "relay.lede": "When a session has gone dumb, don't ask it to write its own handoff: it would pass its mistakes on. Your coding tool already keeps a full record of every session on disk. This page reads that record <b>by code</b> and packs what matters for a fresh session to settle.",
    "relay.s1k": "1 · THIS APP", "relay.s1t": "Extract", "relay.s1p": "Pick the session below. The app pulls out everything you said (word for word), the files and commands, and a version baseline, and hides passwords and keys. No model is involved.",
    "relay.s2k": "2 · NEW SESSION", "relay.s2t": "Settle", "relay.s2p": "Open a fresh session and type <code>/relay-in</code>. It distills the package into a one-page <code>HANDOFF.md</code> (in a subagent when it can) and checks it: with git where there is git, by file size and time where there isn't.",
    "relay.s3k": "3 · YOU", "relay.s3t": "Confirm", "relay.s3p": "It shows you the goal and a checklist of at most 10 items. Tick, strike or edit; your edits win. Only then does it start working.",
    "relay.pickTitle": "Sessions on this computer", "relay.refresh": "Refresh", "relay.file": "Choose a record file…",
    "relay.search": "Filter by title, folder or anything you said",
    "relay.remote": "Remote Control",
    "relay.latest": "Latest: ",
    "relay.first": "First: ",
    "relay.countAll": "{n} sessions",
    "relay.countSome": "{n} sessions; showing the newest {m}. Type to narrow down.",
    "relay.profile": "Account",
    "relay.noMatch": "No session matches.",
    "relay.cloudTitle": "Session not on this computer?",
    "relay.cloudLede": "Cloud sessions (claude.ai/code in the cloud, Projects, Codex cloud tasks) and sessions on another computer keep no record here. Remote Control sessions that run on this computer do: they are in the list above. For the rest, the session packs its own work. A lead that started sub-sessions also has each of them package itself, checks every package against what it knows, and lists anyone missing. The session sees less than this app does (compacted messages are only summarized), so the package says so and the new session checks more.",
    "relay.cloud1": "Copy the prompt below and send it <b>in the old session</b>. For a project, send it to the <b>lead</b> only; it collects from its sub-sessions itself.",
    "relay.cloud2": "It writes <code>.relay/&lt;time&gt;/</code> in the project: <code>INDEX.md</code> (the roster), <code>lead.md</code>, and one file per sub-session in <code>children/</code>. A cloud session commits and pushes it. If it can't write files, it gives you a zip or one code block per file; save them there yourself.",
    "relay.cloud3": "Open a <b>fresh session</b> in the same project (same branch) and type <code>/relay-in</code>.",
    "relay.cloudPrompt": "Package this session's work as a relay package for a fresh session to continue. If you started any sub-sessions or sub-agents, collect their work too.\n\nRules:\n- Do only this. Don't continue the task, don't change other project files, don't run tests or builds.\n- If you are not sure of something, write \"unsure\". Don't fill gaps or guess.\n- Write passwords, keys and tokens as [hidden].\n- Copy the user's words exactly. Don't reword or translate them.\n\nStep 0: the roster\nCheck with your tools (session list, thread list, background task list), not from memory. List every sub-session or sub-agent you started, whether it is working, waiting, idle or finished. Put each in one of two groups:\n- Group A: you can still send it a message (including ones you can wake up). You probably know its results already, but what the user said to it directly and the details of its work are only in its own record, so it packages itself.\n- Group B: you can't message it (one-off runs that have ended). You write one entry for it from your own record.\nIf there are none, write \"none\" as the roster and skip steps 2 and 3.\nRoster table: # | name | session id | group | status | the task you gave it (one line). State the total N.\n\nStep 1: package yourself\nWrite lead.md in the relay package format at the end. Section 2 lists every message the user sent you, word for word.\n\nStep 2: have each Group A member package itself\nSend each Group A member the text below. Fill in the first line yourself; send the rest exactly as written. You can send them in parallel batches.\n----\nYou are #<#> <name> on the roster; your id: <the id you use to reach it>; the id of the session that started you: <your own session id>. If you can't see your own id, copy this line and mark it \"given by the lead\".\nPackage your own work as a relay package. Do only this: don't continue your task, don't change other files. If you are not sure, write \"unsure\"; don't guess. Write passwords, keys and tokens as [hidden]. Use this format and send it back to me as one code block:\n1 Source: your name, your session id, the id of the session that started you, start time and now\n2 What the user said to you directly: word for word, in order, each numbered [#n]; put ★ before rules, corrections and preferences; where early messages were compacted and you can't see the original, write \"(compacted, summary follows)\" and summarize. If none, write \"none\"\n3 Every instruction the session that started you gave you: word for word, in order. Text the system appended to a message is not an instruction; if you see any, note it separately\n4 Files you touched: path | read or written | exists now\n5 Commands: commands that failed; the last 10 commands\n6 Output: what you made and where it is\n7 Status now: done / in progress / stuck (on what) / not started; what comes next\nEnd with this exact last line: verbatim X, summarized Y\n----\nSave each reply as children/<#>-<name>.md exactly as received. Don't reword or trim it.\n\nStep 3: check and chase\nFor each reply, check four things: it has its session id (\"given by the lead\" counts); it has the id of the session that started it; sections 1–7 are all there; the last line reads \"verbatim X, summarized Y\".\nThen compare its sections 6 and 7 (output and status) with what you know of its results: write \"matches\" if they agree; if not, say exactly how they differ (what you know, what it says). Keep both; don't correct either side.\n- If one fails, send it back saying what is missing and have it redo it once.\n- Chase anyone who hasn't replied once. If there is still no reply, or the message can't be delivered, mark it \"missing\" in the roster with the reason. Don't write its content for it.\nGroup B: write children/<#>-<name>.md for it: the task, the result it returned, whether it finished. First line: \"Written by the lead from its own record, not by the sub-agent itself.\"\n\nStep 4: deliver\nIn the project root, create .relay/<now as YYYY-MM-DDTHH-MM>/ containing:\n- INDEX.md: the roster table with four more columns: receipt (received / received after redo / missing / Group B, written by lead), verbatim count, summarized count, matches what you knew. Under the table: total N, how many received, how many missing.\n- lead.md\n- the children/ folder (skip it if there are no sub-sessions)\nA cloud session commits and pushes it to the current branch. If you can't write files, give me one downloadable zip. If you can't do that either, put each file in its own code block, with its path on the line before.\n\nThen reply with only three things: where the package is; of N, how many received, how many written by you, how many missing; which ones are missing and why.\n\nRelay package format (for lead.md):\n# RELAY — <the task in one line>  (written by the session itself)\n## 1 Source: tool, session id, project folder, branch, start time and now\n## 2 What the user said (verbatim): every message the user sent you, in order, word for word where you can still see it. Where early messages were compacted and you can't see the original, write \"(compacted, summary follows)\" and summarize. Put ★ before rules, corrections and preferences. Number each [#n].\n## 3 Files touched: path | read or written | exists now\n## 4 Commands: commands that failed; the last 10 commands\n## 5 Links\n## 6 Version baseline: git repository, branch, current commit (run git rev-parse HEAD for the real value). For files outside git: size and modified time.\n## 7 Context files to read: CLAUDE.md, AGENTS.md, memory files, with paths\n## 8 Where I think we are (low trust): done / in progress / stuck / next, each with what it is based on\nLast line: verbatim X, summarized Y",
    "relay.loading": "Reading session records…", "relay.listFailed": "Could not read session records: ",
    "relay.empty": "No Claude Code or Codex sessions found on this computer. ChatGPT and other web chats keep no record here: use the chat prompts on the \"Kit & files\" page.",
    "relay.spawned": "started by another session", "relay.noText": "(no text message)", "relay.picked": "Chosen record file", "relay.justNow": "just now",
    "relay.extracting": "Extracting…", "relay.previewFailed": "Could not read this session: ",
    "relay.from": "From", "relay.folder": "Folder", "relay.time": "Time",
    "relay.words": "Your messages", "relay.rules": (n) => `${n} rule${n === 1 ? "" : "s"} or correction${n === 1 ? "" : "s"}`, "relay.files": "Files touched", "relay.missing": "missing now",
    "relay.commands": "Commands", "relay.failed": "failed", "relay.compactions": "Compactions", "relay.secrets": "Secrets hidden", "relay.check": "Version check: ",
    "relay.checkVal": (g, o) => [g ? `${g} git repositor${g === 1 ? "y" : "ies"}` : "", o ? `${o} file${o === 1 ? "" : "s"} by size and time` : ""].filter(Boolean).join(" + ") || "nothing to check (you'll be asked)",
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
    "score.lede": "在会话里发完 <code>/canary</code>，对照 AI 的回答点选分数。评分标准只在这里，<b>不要发给 AI</b>，否则它会照着标准应付。",
    "score.env": "使用环境", "score.modeCc": "Claude Code（4 题）", "score.modeWeb": "ChatGPT / 网页版（3 题）", "score.reset": "重新打分",
    "score.pts": (v) => `${v} 分`,
    "score.left": (n) => `还差 ${n} 题`, "score.leftTip": "每题选一个分数。",
    "score.good": "好卡", "score.mid": "一般", "score.bad": "坏卡",
    "score.goodCc": "马上用 /rewind 退回测试之前，开始正事。", "score.goodWeb": "编辑第一条消息，换成你的正事。",
    "score.midTip": "简单任务可以用；重要任务建议关掉重开。", "score.badTip": "关掉这个会话，重开一个再测。",
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
    "copy.done": "已复制", "copy.failed": "复制失败", "copy.btn": "复制",
    "nav.relay": "接力换会话",
    "relay.eyebrow": "接力", "relay.title": "把工作搬到新会话",
    "relay.lede": "会话变傻了，别让它自己写交接：它会把自己的错误一起交过去。你的编程工具在硬盘上本来就存着每个会话的完整记录。这一页<b>用代码</b>读这份记录，把有用的东西打包，交给新会话接收。",
    "relay.s1k": "1 · 本软件", "relay.s1t": "提取", "relay.s1p": "在下面选会话。软件提取你说过的每一句话（原文）、碰过的文件和命令、版本基线，并把密码和密钥打码。全程不经过任何模型。",
    "relay.s2k": "2 · 新会话", "relay.s2t": "接收", "relay.s2p": "开一个新会话，输入 <code>/relay-in</code>。它把接力包提炼成一页 <code>HANDOFF.md</code>（能用子代理就用子代理），再核对：有 git 用 git，没有 git 就比文件大小和修改时间。",
    "relay.s3k": "3 · 你", "relay.s3t": "确认", "relay.s3p": "它给你看一句话目标和不超过 10 行的清单。你打勾、划掉或修改，以你为准，然后它才开始干活。",
    "relay.pickTitle": "这台电脑上的会话", "relay.refresh": "刷新", "relay.file": "选择记录文件…",
    "relay.search": "按标题、文件夹或你说过的话筛选",
    "relay.remote": "远程控制",
    "relay.latest": "最新：",
    "relay.first": "第一句：",
    "relay.countAll": "共 {n} 个会话",
    "relay.countSome": "共 {n} 个会话，显示最近的 {m} 个。输入关键词缩小范围。",
    "relay.profile": "账号",
    "relay.noMatch": "没有符合的会话。",
    "relay.cloudTitle": "会话不在这台电脑上？",
    "relay.cloudLede": "云端会话（claude.ai/code 的云端会话、Projects 项目、Codex 云端任务）和别的电脑上的会话，本机没有记录。在这台电脑上运行的远程控制会话是有的，就在上面的列表里。其余的，让会话自己打包。派出过子会话的 lead，还会让每个子会话自己打包，拿每一份和自己知道的结果对账，并列出没交的。会话自己看到的比本应用少（被压缩的消息只能概括），所以包里会注明，新会话会多核对一步。",
    "relay.cloud1": "复制下面的提示词，<b>发给旧会话</b>。如果是一个项目，只发给 <b>lead</b>，它会自己去收子会话的。",
    "relay.cloud2": "它会在项目里写出 <code>.relay/&lt;时间&gt;/</code>：<code>INDEX.md</code>（名单）、<code>lead.md</code>，以及 <code>children/</code> 里每个子会话一份。云端会话会提交并推送。写不了文件的，它会给你一个压缩包，或者每个文件一个代码块，你自己存到这个位置。",
    "relay.cloud3": "在同一个项目（同一个分支）里开一个<b>新会话</b>，输入 <code>/relay-in</code>。",
    "relay.cloudPrompt": "把这个会话的工作整理成一个接力包，交给一个全新的会话接着做。如果你派出过子会话或子 agent，把它们的工作也一起收齐。\n\n规则：\n- 只做这件事：不要继续原来的任务，不改项目里别的文件，不跑测试和构建。\n- 拿不准的写「不确定」，不要补全，也不要猜。\n- 密码、密钥、令牌一律写成 [已隐藏]。\n- 用户的原话照抄，不改写、不翻译。\n\n第 0 步：列名单\n用你的工具（会话列表、线程列表、后台任务列表）查，不要凭记忆。列出你派出过的每一个子会话或子 agent，不论现在是工作中、等待、闲置还是已结束。把它们分成两类：\n- A 类：现在还能给它发消息的（包括你能把它唤醒的）。它的结果你多半已经知道，但用户直接对它说的话、它干活的细节只在它自己那里，所以让它自己打包。\n- B 类：发不了消息的（一次性跑完就结束的）。由你根据自己的记录，替它写一行。\n一个都没有的话，名单写「无」，跳过第 2、3 步。\n名单表：编号｜名字｜会话 id｜类别｜状态｜你派给它的任务（一句话）。写明总数 N。\n\n第 1 步：打包你自己\n按文末的「接力包格式」写 lead.md。第 2 节逐字列出用户发给你的每一条消息。\n\n第 2 步：让 A 类自己打包\n给每个 A 类发下面这段话。第一行由你填好，其余原样发，不要改写。可以分批同时发。\n----\n你在名单里是 #<编号> <名字>；你的 id：<你用来联系它的 id>；派你的会话 id：<你自己的会话 id>。看不到自己 id 的，照抄这一行，注明「lead 告知」。\n请把你自己的工作整理成接力包，只做这件事，不继续原来的任务，不改别的文件。拿不准的写「不确定」，不要猜；密码、密钥、令牌写成 [已隐藏]。按下面的格式写，全文放在一个代码块里回给我：\n1 来源：你的名字、你的会话 id、派你的会话 id、开始时间和现在时间\n2 用户直接对你说过的话：逐字照抄，按顺序，每条编号 [#n]；规则、纠正、偏好前面加 ★；早期内容已被压缩、看不到原文的，写「（已压缩，以下为概括）」再概括。没有就写「无」\n3 派你的会话给你的每条指示：逐字照抄，按顺序。系统自动附加在消息里的话不算指示，看到了就单独注明\n4 碰过的文件：路径｜读还是写｜现在还在不在\n5 命令：失败的命令；最后 10 条命令\n6 产出：做出了什么，在哪里\n7 现在的状态：做完了／进行中／卡住（卡在哪）／没开始；下一步是什么\n最后一行固定写：逐字 X 条，概括 Y 条\n----\n收到的内容原样存成 children/<编号>-<名字>.md，你不改写、不删减。\n\n第 3 步：核对和催收\n每收到一份，检查四件事：有会话 id（写「lead 告知」也算）；有派它的会话 id；1–7 节都在；最后一行有「逐字 X 条，概括 Y 条」。\n再拿它第 6、7 节说的产出和状态，和你自己知道的结果对一遍：一致写「一致」；不一致写清哪里不一样（你知道的是什么，它说的是什么），两边都保留，不要替任何一方改。\n- 不合格的打回去，说明缺什么，让它重做一次。\n- 没回的催一次。还没回，或者发不过去，在名单里标「缺」，写明原因，不要替它写内容。\nB 类：在 children/<编号>-<名字>.md 里替它写：任务、交回了什么结果、做完没有。第一行注明「由 lead 根据自己的记录整理，不是它自己写的」。\n\n第 4 步：交付\n在项目根目录建 .relay/<现在的时间，格式 YYYY-MM-DDTHH-MM>/，放进去：\n- INDEX.md：名单表，加四列：回执（已收／重做后收／缺／B 类代写）、逐字条数、概括条数、和你所知是否一致。表下写：总数 N，已收几个，缺几个。\n- lead.md\n- children/ 目录（没有子会话就不建）\n云端会话要提交并推送到当前分支。写不了文件，就打成一个可下载的压缩包；连这个也做不到，就把每个文件分别放进一个代码块，代码块前一行写出文件路径。\n\n最后只回复三件事：包在哪里；N 个里收齐几个、代写几个、缺几个；缺的是哪几个，原因是什么。\n\n接力包格式（lead.md 用）：\n# RELAY — <一句话说清任务>（由会话自己整理）\n## 1 来源：工具、会话 id、项目文件夹、分支、开始时间和现在时间\n## 2 用户说过的话（原文）：按顺序列出用户发给你的每一条消息，能看到原文的逐字照抄；早期内容已被压缩、看不到原文的，写「（已压缩，以下为概括）」再概括。规则、纠正、偏好前面加 ★。每条编号 [#n]。\n## 3 碰过的文件：路径｜读还是写｜现在还在不在\n## 4 命令：失败过的命令；最后 10 条命令\n## 5 链接\n## 6 版本基线：git 仓库、分支、当前提交号（运行 git rev-parse HEAD 取真实值）。不在 git 里的文件写大小和修改时间。\n## 7 要读的上下文文件：CLAUDE.md、AGENTS.md、记忆文件等，写路径\n## 8 我以为的进度（低可信）：做完了什么、正在做什么、卡在哪、下一步，每条写依据\n最后一行：逐字 X 条，概括 Y 条",
    "relay.loading": "正在读取会话记录…", "relay.listFailed": "读不了会话记录：",
    "relay.empty": "这台电脑上没有找到 Claude Code 或 Codex 的会话。ChatGPT 等网页版不在本机留记录，请用「工具与文件」页的通用版提示词。",
    "relay.spawned": "由其他会话启动", "relay.noText": "（没有文字消息）", "relay.picked": "手动选择的记录文件", "relay.justNow": "刚刚",
    "relay.extracting": "正在提取…", "relay.previewFailed": "读不了这个会话：",
    "relay.from": "来源", "relay.folder": "目录", "relay.time": "时间",
    "relay.words": "你的消息", "relay.rules": (n) => `${n} 条规则和纠正`, "relay.files": "碰过的文件", "relay.missing": "个现在不在了",
    "relay.commands": "命令", "relay.failed": "条失败", "relay.compactions": "压缩次数", "relay.secrets": "已打码的密钥", "relay.check": "版本核对：",
    "relay.checkVal": (g, o) => [g ? `${g} 个 git 仓库` : "", o ? `${o} 个文件按大小和时间` : ""].filter(Boolean).join(" + ") || "没有可核对的（会问你）",
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
      s: ["没读文件就猜，或者张口“一般来说”", "读了一部分，结论里有猜测", "真的读了 package.json / pyproject / README 等再回答"] },
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
    { path: "skills/canary/SKILL.md", name: "/canary", where: "Claude Code skill", what: "开局测试，4 道小题", when: "新会话的第一条消息", how: "输入 /canary，再到「测卡打分」里打分" },
    { path: "skills/handoff/SKILL.md", name: "/handoff", where: "Claude Code skill", what: "把当前工作写成 HANDOFF.md：目标、决定、现状、死路、偏好、下一步", when: "会话变傻、救不回来时", how: "输入 /handoff，核对它列出的不确定项" },
    { path: "skills/pickup/SKILL.md", name: "/pickup", where: "Claude Code skill", what: "新会话读 HANDOFF.md，用 git 核对后复述目标，等你确认再动手", when: "新会话测卡通过、干净开局之后", how: "输入 /pickup" },
    { path: "skills/relay-in/SKILL.md", name: "/relay-in", where: "Claude Code skill", what: "接收接力包：把 RELAY.md 提炼成 HANDOFF.md（能用子代理就用），用 git 或文件大小/时间核对，再和你确认", when: "在「接力」页生成接力包后，在新会话里", how: "输入 /relay-in" },
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
  $$("[data-i18n-ph]").forEach((el) => el.setAttribute("placeholder", t(el.dataset.i18nPh)));
  $("#relay-cloud-prompt").textContent = t("relay.cloudPrompt");
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
const ACTION = { new: ["install.new", "good"], same: ["install.same", "neutral"], backup: ["install.backup", "mid"] };
$("#btn-plan").addEventListener("click", async () => {
  const box = $("#plan");
  const forLang = lang;
  let plan;
  try { plan = await api.plan(forLang); } catch (e) { box.replaceChildren(h("p", { className: "warn", textContent: t("install.checkFailed") + errText(e) })); return; }
  const list = h("ul", { className: "planlist" }, ...plan.items.map((it) => {
    const [key, cls] = ACTION[it.action];
    return h("li", {}, h("code", { textContent: it.name }), h("span", { className: "pill " + cls, textContent: t(key) }));
  }));
  box.replaceChildren(h("p", {}, t("install.where"), h("code", { className: "path", textContent: plan.target })), list);
  if (plan.items.every((it) => it.action === "same")) { box.append(h("p", { className: "okmsg", textContent: t("install.allSame") })); return; }
  if (plan.items.some((it) => it.action === "backup")) box.append(h("p", { className: "muted", innerHTML: t("install.backupNote") }));
  const go = h("button", { className: "primary", textContent: t("install.confirm") });
  const row = h("div", { className: "row-actions" }, go);
  box.append(row);
  go.addEventListener("click", async () => {
    go.disabled = true;
    try {
      const r = await api.install(forLang);
      // All backups of one install share a timestamped folder; show that folder once.
      const backups = [...new Set(r.items.filter((x) => x.backupTo).map((x) => x.backupTo.replace(/[\\/][^\\/]+[\\/]?$/, "")))];
      const rv = h("button", { className: "small", textContent: t("install.reveal") });
      rv.addEventListener("click", () => api.reveal(r.target + "/canary"));
      fill(row, h("p", { className: "okmsg", textContent: t("install.done") }),
        backups.length ? h("p", { className: "muted" }, t("install.backedUp"), ...backups.map((b) => h("code", { className: "path", textContent: b }))) : null, rv);
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
  if (Math.abs(m) < 1) return t("relay.justNow");
  return Math.abs(m) < 60 ? rtf.format(m, "minute") : Math.abs(m) < 2880 ? rtf.format(Math.round(m / 60), "hour") : rtf.format(Math.round(m / 1440), "day");
};
const mb = (b) => (b / 1048576 >= 1 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const tail = (p) => (p ? p.split(/[\\/]/).filter(Boolean).slice(-2).join("/") : "—");
const TOOL = { "claude-code": "Claude Code", codex: "Codex" };
const RELAY_SHOW = 200;

function renderRelayList() {
  const box = $("#relay-list");
  if (!relayRows) return;
  if (!relayRows.length) { box.replaceChildren(h("p", { className: "muted", textContent: t("relay.empty") })); return; }
  // Search covers the title, folder, first and latest message, and profile. Only the first RELAY_SHOW matches are
  // drawn: a full scan can find thousands of sessions.
  const q = ($("#relay-search").value || "").trim().toLowerCase();
  const all = q ? relayRows.filter((r) => [r.title, r.cwd, r.prompt, r.last, r.profile].some((x) => x && x.toLowerCase().includes(q))) : relayRows;
  if (!all.length) { box.replaceChildren(h("p", { className: "muted", textContent: t("relay.noMatch") })); return; }
  const rows = all.slice(0, RELAY_SHOW);
  const note = h("p", { className: "muted relay-count", textContent: all.length > rows.length ? t("relay.countSome").replace("{n}", all.length).replace("{m}", rows.length) : t("relay.countAll").replace("{n}", all.length) });
  box.replaceChildren(note, ...rows.map((r) => {
    const name = r.title || (r.cwd ? tail(r.cwd) : r.file.split(/[\\/]/).pop());
    const said = r.picked ? t("relay.picked") : r.last ? t("relay.latest") + r.last : r.prompt || (r.spawned ? t("relay.spawned") : t("relay.noText"));
    const b = h("button", { className: "sess" + (relayCurrent === r.file ? " on" : "") },
      h("span", { className: "sess-tags" },
        h("span", { className: "pill " + (r.harness === "codex" ? "mid" : "good"), textContent: TOOL[r.harness] }),
        r.remote ? h("span", { className: "pill neutral", textContent: t("relay.remote") }) : null,
        r.profile ? h("span", { className: "pill neutral", textContent: t("relay.profile") + " " + r.profile.toUpperCase() }) : null),
      h("span", { className: "sess-main" },
        h("b", { textContent: name }),
        h("span", { className: "muted", textContent: r.title && r.cwd ? tail(r.cwd) + " · " + said : said })),
      h("span", { className: "sess-meta muted", textContent: ago(r.mtime) + (r.size ? " · " + mb(r.size) : "") }));
    b.setAttribute("role", "listitem");
    b.title = [r.title, r.prompt && !r.picked ? t("relay.first") + r.prompt : "", r.last ? t("relay.latest") + r.last : "", r.file].filter(Boolean).join("\n");
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
  const row0 = relayRows && relayRows.find((r) => r.file === file);
  if (row0 && row0.picked && s.cwd && !row0.cwd) { row0.cwd = s.cwd; renderRelayList(); }
  const kv = h("dl", { className: "kv wide" });
  const row = (k, v) => kv.append(h("dt", { textContent: k }), h("dd", {}, ...[].concat(v)));
  row(t("relay.from"), `${s.tool} · ${s.sessionId || ""}`);
  row(t("relay.folder"), h("code", { textContent: s.cwd || "—" }));
  row(t("relay.time"), `${(s.started || "").slice(0, 16).replace("T", " ")} → ${(s.ended || "").slice(0, 16).replace("T", " ")}`);
  const stats = h("div", { className: "stats" },
    ...[[t("relay.words"), s.words, s.rules ? `★ ${t("relay.rules", s.rules)}` : ""],
      [t("relay.files"), s.files, s.missing ? `${s.missing} ${t("relay.missing")}` : ""],
      [t("relay.commands"), s.commands, s.failed ? `${s.failed} ${t("relay.failed")}` : ""],
      [t("relay.compactions"), s.compactions, ""],
      [t("relay.secrets"), s.secrets, ""]]
      .map(([k, n, sub]) => h("div", { className: "stat" }, h("span", { className: "muted", textContent: k }), h("b", { textContent: String(n) }), sub ? h("small", { textContent: sub }) : null)));
  const check = h("p", {}, h("span", { className: "muted", textContent: t("relay.check") }), t("relay.checkVal", s.repos, s.outsideGit));
  const go = h("button", { className: "primary", textContent: t("relay.create") });
  const other = h("button", { className: "small", textContent: t("relay.elsewhere") });
  const actions = h("div", { className: "row-actions" }, go, other);
  const done = h("div", { className: "stack" });
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
        const c = h("button", { className: "small", textContent: t("copy.btn") }); c.dataset.copy = id;
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
$("#relay-search").addEventListener("input", renderRelayList);
$("#relay-file").addEventListener("click", async () => {
  const f = await api.relayPick(lang);
  if (f) { relayRows = [{ file: f, harness: /rollout-/.test(f) ? "codex" : "claude-code", cwd: null, prompt: "", picked: true, mtime: Date.now(), size: 0 }, ...(relayRows || []).filter((r) => r.file !== f)]; previewRelay(f); }
});

// Narrow tables stack into label/value rows (style.css); each cell carries its column name.
$$(".tbl table").forEach((tb) => {
  const heads = $$("thead th", tb).map((th) => th.textContent.trim());
  $$("tbody tr", tb).forEach((tr) => [...tr.children].forEach((td, i) => { if (heads[i]) td.dataset.label = heads[i]; }));
});
applyLang();
setMode("cc");
// The full version (e.g. 1.1.4) comes from package.json, so the sidebar never lags behind a release.
api.version().then((v) => { $("#app-version").textContent = "Reroll · v" + v; });
// Open on Overview in whichever language was saved (the static HTML only un-hides the English page).
show("home");

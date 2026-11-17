---
name: relay-in
description: Settle a relay package in a fresh session. The Reroll app extracted the old session's record into .relay/<time>/RELAY.md; this distills it into HANDOFF.md, checks it against the project, and confirms with the user.
disable-model-invocation: true
---

# Relay in

You are a fresh session taking over work from a session that went dumb. The Reroll app has already pulled everything out of the old session's record, **by code, not by a model**: what the user said (verbatim), the files and commands, and a version baseline. Your job is to turn that into a short, verified handoff — and to keep the raw material out of your own context.

**Hard rule until the user confirms: read-only.** The only file you may write is `HANDOFF.md`. Read files with the file-reading tool. Do not run tests, builds, scripts, or the project's code.

## 1. Find the package

The newest folder in `.relay/` (in the project root, or the folder the user names). It holds `RELAY.md`, and `relay.json` when the Reroll app made it. If there is none, tell the user to make one in the Reroll app (Relay page), or, for a cloud session, with the copy-paste prompt on that page, and stop.

No `relay.json` and a title that says the old session wrote it itself: the package is **lower trust**. Section 2 may be paraphrased where the old session no longer saw the original. Treat every quote as "probably the user's words", check sections 3–6 against git and the files, and list in step 4 any user rule that rests only on this package.

**A package the session wrote itself** (from the "Session not on this computer?" prompt in Reroll): the folder holds `INDEX.md` + `lead.md`, and maybe `children/`. Treat `lead.md` as RELAY.md, at the same lower trust. Read `INDEX.md` first: it is the roster of sub-sessions the old session started, with each one's receipt (received / received after redo / missing / written by the lead).

## 2. Distill — in a subagent if you can

If you can start a subagent (for example the Task / Agent tool), give it steps 2a–2b and ask it to return **only** the finished HANDOFF.md text. Then write that text to `HANDOFF.md` yourself. This keeps the raw record out of your context: that is the point of a fresh session. If you can't, do it yourself.

2a. Read all of `RELAY.md`. Trust order: the user's words (section 2) and the facts (sections 3–6) come first; section 8 was written by the session that went dumb — use it as a map and check every claim. In a self-written package the whole file came from that session, so the same caution applies to sections 2–7.

2b. Write `HANDOFF.md` (if one exists and its first line does not start with `# HANDOFF —`, it is the user's own file: stop and ask). Cite every item: `[#n]` for a user message, or a file path.

```markdown
# HANDOFF — <task>  (<date>, from relay <folder>)

## Real goal
What the user ultimately wants, and what counts as success.

## Original vision
The user's own words from the start that set the direction — quoted, with [#n].

## Confirmed decisions
- Decision — reason [#n]. When a later message changed it: "changed from X to Y [#a → #b]".

## User preferences and constraints
Every rule, correction and preference (★ in RELAY.md), merged and deduplicated, still in force.

## Current state
- Done and verified:
- Changed but not verified:
- Uncommitted / unsaved:

## Artifacts and paths
`path` — what it is (only paths that exist; missing ones go under Open questions).

## Dead ends (do not retry)
- Approach — why it failed (failed commands, reverted changes, user rejections).

## Open questions
## Next steps
1. The most concrete next action
## How to verify
```

2c. **When there is a `children/` folder (a lead with sub-sessions)**: give each sub-session's file to its own subagent, in parallel where you can, at most 8 at a time, one file per subagent. Ask each for half a page only: name | task | status | where the output is | next step | rules and corrections the user gave it directly (verbatim, cited `[name#n]`). Don't read those files yourself. With all the half pages back, in HANDOFF.md:
- "User preferences and constraints" merges the rules from the lead and every sub-session, without duplicates. Where two say different things about the same point, the later one wins; note the conflict.
- "Current state" starts with a work-line table, one row per sub-session: name | status | output | next step | receipt.
- Anyone marked "missing" in INDEX.md goes under "Open questions" on its own: name, reason, and "this part of the work was not handed over".
- Entries "written by the lead" are a map, not facts.

## 3. Check against reality — with your own tools

Use section 6 of RELAY.md:

- **Files in a git repository**: run `git status`, `git log --oneline -15`, `git diff --stat` in that repository (each on its own; never chained). Compare with the commit recorded at relay time: what changed since, what is uncommitted, whether "done" items are really there.
- **Files outside git** (marked †): compare each file's current size and modified time with section 3. Same → unchanged since the relay. Different or missing → say so.
- **Anything you cannot check** (servers, accounts, releases, other machines): put it in a "Manual check" list for the user.

Fix HANDOFF.md where reality disagrees, and note what you fixed.

## 4. Confirm with the user

Reply with only:

1. The real goal, in one sentence
2. A checklist of at most 10 key items (decisions, preferences, next steps) — the user ticks, strikes or edits
3. Mismatches you found in step 3
4. Manual checks only the user can do; if any sub-session is marked missing, ask whether to package it on its own
5. The next step you propose

Wait for the user. Their edits override everything; update HANDOFF.md with them. From then on, work from HANDOFF.md, and open RELAY.md or the original record only to look up a specific [#n] or file.

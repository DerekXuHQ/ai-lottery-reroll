---
name: handoff
description: Hand the current session's work over to a brand-new session. Use when the session has gone dumb, the context is too long, or you want a fresh draw.
disable-model-invocation: true
---

# Handoff

Goal: a new session with **no memory of this conversation** can pick up seamlessly by reading a single file.

## Principles

- **Trust files and git, not memory.** This session may already be polluted; your impression of "what was done" is unreliable. Confirm every item under "Current state" by actually looking at files, `git status`, `git diff`, and `git log`.
- **Dead ends matter more than results.** Approaches that were rejected and pitfalls that were hit must be written down, with the reason, so the new session does not repeat them.
- **Separate what the user confirmed from what you inferred.** Mark inferences with [inferred].
- Write only what the new session needs. Do not retell the conversation.

## Steps

1. Run `git status`, `git diff --stat`, `git log --oneline -15` (skip if this is not a git repo) and look at the key files changed in this session. Run only these read-only commands, each on its own — never chained with `&&`, `;` or pipes. Look at files with the file-reading tool, not with `cat`/`ls`. Do not run tests, scripts, builds, or the project's code.
2. Write `HANDOFF.md` in the project root. This is the only file you may write.
   - If it exists and its first line starts with `# HANDOFF —`: it is an earlier handoff. Read it, then update it as a whole.
   - If it exists in any other format: it is the user's own file. **Stop and ask the user.** Do not overwrite it.
   Use this structure:

```markdown
# HANDOFF — <task name>  (<date>)

## Real goal
What the user ultimately wants (not just the literal task). What counts as success.

## Confirmed decisions
- Decision — reason (user confirmed / [inferred])

## Current state (verified)
- Done and verified:
- Changed but not verified:
- Key files: `path` — purpose
- Uncommitted changes:

## Dead ends (do not retry)
- Approach — why it does not work

## User preferences and constraints
Requirements, habits, and dislikes the user expressed in this conversation.

## Open questions
Things the user needs to decide.

## Next steps
1. The most concrete next action
2. ...

## How to verify
How to confirm the task is done: commands to run, results to look for.
```

3. If there are uncommitted changes, ask the user whether to commit first. **Do not commit yourself.**
4. Finally, output only three things:
   - The path of `HANDOFF.md`
   - The 1–3 items you are least sure about, for the user to check
   - One line for starting the new session: `/pickup` (if the new session also has the pickup skill), otherwise: `Read HANDOFF.md, check it against git, restate the goal and next steps, and wait for my confirmation before doing anything.`

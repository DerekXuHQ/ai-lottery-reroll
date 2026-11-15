# AI Lottery · Reroll — session kit

## The idea in one table

How good a session is comes from three layers stacked on top of each other:

| Layer | Cause | Remedy | Tool |
|---|---|---|---|
| 1 Opening | Server routing, load, reasoning effort: a lottery, and it sticks | Test first; reroll bad draws | `/canary` + scoring rubric |
| 2 First ~10 turns | The model locks in its reading of your intent early and rarely revisits it | After passing, `/rewind` to a clean start; roll back as soon as it drifts | `/rewind` |
| 3 Later on | The context fills with its own mistakes and pollutes itself; long contexts blur | Remove pollution instead of adding corrections; if it can't be saved, reroll and carry the work over in files | `/rewind` `/compact` `/handoff` `/pickup` |

The key: **your work lives in files and git, not in the session.** Sessions are disposable.

## Contents

| File | Purpose | When |
|---|---|---|
| `skills/canary/` | `/canary`: 4-question opening test | First message of a new session |
| `scoring-rubric.md` | Score the opening test (**for your eyes only**) | After reading the AI's answers |
| `skills/handoff/` | `/handoff`: write the work into `HANDOFF.md` | When the old session goes dumb |
| `skills/pickup/` | `/pickup`: take over in a new session | First real message of the new session |
| `skills/relay-in/` | `/relay-in`: a new session settles a relay package made by the app | First message of the new session |
| `chat-prompts.md` | Copy-paste versions of the opening test, handoff and pickup | ChatGPT, web chats |

## Install (Claude Code, on your own computer)

Easiest: the Install page in the AI Lottery · Reroll app (existing skills with the same name are backed up, never overwritten).

By hand: run this inside this folder to copy the folders under `skills/` into `~/.claude/skills/`, available in every project (`-n` means never overwrite existing files):

```bash
mkdir -p ~/.claude/skills && cp -Rn skills/* ~/.claude/skills/
```

For a single project only, copy them into that project's `.claude/skills/` instead.

All four skills are manual-only: the AI never invokes them on its own.

## Flow

```
New session
   ↓
/canary  →  score with the rubric
   ├─ ≤ 4: close it, start over
   └─ ≥ 7: /rewind to before the test, start real work
         ↓
      Work (commit after each piece)
         ↓
      Getting dumb?
         ├─ Just started: /rewind to before it went wrong, rephrase and resend
         ├─ Context too long: /compact keeping only the goal, confirmed decisions, current state; drop rejected approaches
         └─ Can't be saved: /handoff → check HANDOFF.md → new session → /canary → /pickup
```

## Signs it has gone dumb

- Repeats the same mistake after 2+ corrections
- Rejected approaches come back
- Keeps apologizing and agreeing with everything
- Fixing A breaks B

On any of these, **stop correcting in place**. Every correction adds more pollution to the context.

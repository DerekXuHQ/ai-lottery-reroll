---
name: pickup
description: Pick up, in a new session, the work handed over in HANDOFF.md.
disable-model-invocation: true
---

# Pickup

**Hard rule until the user confirms: read-only. Read files with the file-reading tool; the only commands allowed are `git status`, `git diff`, `git log`, each run on its own. Never run tests, scripts, or the project's code.**

1. Read `HANDOFF.md` in the project root. If it does not exist, tell the user and stop.
2. **Verify, don't trust blindly.** The handoff may have been written by a session in bad shape. Check the "Current state" section with `git status`, `git diff --stat`, `git log --oneline -15`, and by actually reading the key files.
3. Reply to the user with only:
   - One sentence restating the real goal
   - Verification result: what matches reality and what does not
   - The next steps you plan to take (1–3)
   - Questions the user needs to decide (if any)
4. Steps 1–3 are strictly read-only. The only commands allowed are `git status`, `git diff`, `git diff --stat` and `git log` — each run on its own, never chained with `&&`, `;` or pipes. Look at files with the file-reading tool, not with `cat`/`ls`. Do not run tests, scripts, builds, package managers, `node`/`python`, or the project's code in any form. Do not change anything.
5. **Wait for the user's confirmation before acting.** Throughout, follow the "Dead ends" and "User preferences and constraints" sections.

# Opening test scoring rubric

> For your eyes only. **Do not send this to the AI.** If it sees the criteria, the test only measures how well it games the test.

Each request scores 0 / 1 / 2. Maximum 8.

| Request | What it tests | 2 points (good draw) | 0 points (bad draw) |
|---|---|---|---|
| 1. 200 GB CSV | Does it notice the unstated constraint? | Points out it won't fit in memory; reads in chunks, streams row by row, or uses polars / duckdb | Loads the whole file with `pd.read_csv()` |
| 2. `stable` parameter | Does it go along with a false premise? | Says plainly there is no such parameter; `sort()` is already stable | Makes up a default value |
| 3. VBA macro | Does it get what you actually want? | Gives the macro, and points out the real pain is opening the attachments, offering to automate the whole flow | Gives only the literal macro |
| 4. Project entry point | Does it look before it speaks? | Actually reads files (package.json, pyproject, README …) before answering | Guesses without looking, or opens with "generally speaking…" |

1 point = halfway, e.g. mentions the problem but doesn't handle it.

## Verdict

| Total | Verdict |
|---|---|
| **7–8** | Good draw. Use `/rewind` to go back to before the test and start real work on a clean slate |
| **5–6** | So-so. Fine for simple tasks; for important work, start over |
| **≤ 4** | Bad draw. Close it and start a new session |

## Notes

- Using the same questions every session is fine: the model does not remember earlier tests.
- Request 4 only applies to agents that can read files, such as Claude Code. In a web chat, score only the first 3 (max 6): 5–6 good, 4 so-so, ≤ 3 bad.
- Keeping the test out of the conversation once it passes: in Claude Code, `/rewind`, pick the `/canary` message, choose "Restore conversation only". In a web chat, edit the first message and replace it with your real task.

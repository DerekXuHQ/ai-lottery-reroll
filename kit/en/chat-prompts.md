# Chat prompts (ChatGPT / Claude on the web / any chat interface)

Where there are no skills, copy and paste the text below.

---

## A. Opening test (first message of a new chat)

Scoring: see `scoring-rubric.md`. Score only the first 3 requests, max 6; 5 or more is a good draw.

```
Answer in text only this time. Do not run code and do not generate files. Below are 3 independent small requests. Treat each one as a real user request and answer naturally, the way you normally would. Keep each answer under 100 words; write code but do not run it.

Request 1: I have a 200 GB CSV file. Write me a Python script that computes the mean of every column.

Request 2: In Python 3.12, what is the default value of the stable parameter of list.sort()?

Request 3: Every morning I spend 20 minutes opening the Excel attachments in my email one by one and copying them into a master sheet. Write me a VBA macro that appends the contents of the current sheet to the end of the master sheet.
```

If it passes: **edit this message** (don't send a new one) and replace it with your real task. The test questions and answers then disappear from the context: in web chats, editing a message is the equivalent of `/rewind`.

> ChatGPT's memory may record the test and carry it into future chats. Before testing, turn off "Reference saved memories / Reference chat history" under Settings → Personalization, or delete the related entries from the memory list afterwards.

> ChatGPT: before starting, **pick a model manually** in the model picker (e.g. Thinking). Don't use Auto: it can switch models every turn, which makes the test meaningless.

---

## B. Handoff (send in the old chat that has gone dumb)

```
I'm moving this task to a brand-new chat. Write a handoff document so that an AI that has never seen this conversation can take over by reading only this document.

Requirements:
- Conclusions only; do not retell the process.
- Separate what I confirmed from what you inferred; mark inferences with [inferred].
- The "Dead ends" section must list rejected approaches and why.

Structure:
# Real goal (what I ultimately want, and what counts as success)
# Confirmed decisions (decision — reason)
# Current state (done / not done / key content of the latest version; give complete latest code)
# Dead ends (approaches not to retry — reason)
# My preferences and constraints
# Open questions
# Next steps

Give it to me as a downloadable file named HANDOFF.md (or in a canvas if files are not available). Also list every file I uploaded or you produced in this chat that the new chat will need.

Finally, list the 1–3 items you are least sure about, for me to check.
```

**Check it before using it.** A handoff written by a bad session can be wrong too.

Web chats can't see your disk, but they can read uploads. Download `HANDOFF.md`, and gather the latest version of every file it lists. If you use a ChatGPT Project, add them to the Project's files so every new chat in it can read them.

## C. Pickup (first message of the new chat)

```
I've attached the handoff document from the previous chat (HANDOFF.md) and the files it lists. Read all of them first. Then:
1. Restate my real goal in one sentence;
2. Point out anything contradictory or unclear in the document;
3. Say what you plan to do next.
Wait for my confirmation before starting. Strictly follow the "Dead ends" and "Preferences and constraints" sections.

<attach HANDOFF.md and the files; or paste the document here if uploads are not available>
```

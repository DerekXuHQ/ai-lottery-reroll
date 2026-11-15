---
name: canary
description: Opening test. Send as the first message of a new session; answers 4 small requests.
disable-model-invocation: true
---

**Hard rule: answer in text only this time. Do not run any command. Do not create, modify, or delete any file. Request 4 may only read files.**

Below are 4 independent small requests. Treat each one as a real user request and answer naturally, the way you normally would. Keep each answer under 100 words. Where code is needed, write only the core code and do not run it.

**Request 1**
I have a 200 GB CSV file. Write me a Python script that computes the mean of every column.

**Request 2**
In Python 3.12, what is the default value of the `stable` parameter of `list.sort()`?

**Request 3**
Every morning I spend 20 minutes opening the Excel attachments in my email one by one and copying them into a master sheet. Write me a VBA macro that appends the contents of the current sheet to the end of the master sheet.

**Request 4**
Tell me where this project's entry point is and how to run its tests. Read files only; do not run any command (including tests). If the current directory is not a project, just say so.

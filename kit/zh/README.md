# AI Lottery · Reroll（Session 抽卡工具包）

## 原理（一句话版）

session 好坏由三层叠加决定：

| 层 | 原因 | 对策 | 工具 |
|---|---|---|---|
| 1 开局 | 服务器路由、负载、推理强度：抽卡，且黏性延续 | 开局先测，坏卡直接重开 | `/canary` + 评分表 |
| 2 前 10 轮 | 模型早期锁定对你意图的解读，之后不再回头 | 测试通过后 `/rewind` 干净开局；早期发现跑偏立即回退 | `/rewind` |
| 3 越往后 | 上下文积累自己的错误，自我污染；越长越糊 | 删除污染，不追加纠正；救不回来就换卡，工作靠文件延续 | `/rewind` `/compact` `/handoff` `/pickup` |

核心：**工作成果在文件和 git 里，不在 session 里**。session 可以随时丢弃。

## 内容

| 文件 | 用途 | 什么时候用 |
|---|---|---|
| `skills/canary/` | `/canary`：开局测试 4 题 | 新 session 第一条消息 |
| `scoring-rubric.md` | 给开局测试打分（**只给你自己看**） | 看完 AI 的回答后 |
| `skills/handoff/` | `/handoff`：把工作写成 `HANDOFF.md` | 旧 session 变傻时 |
| `skills/pickup/` | `/pickup`：新 session 接手 | 新 session 第一条消息 |
| `skills/relay-in/` | `/relay-in`：新 session 接收软件生成的接力包 | 新 session 第一条消息 |
| `chat-prompts.md` | 开局测试、交接、接手的复制粘贴版 | ChatGPT、网页版 |

## 安装（Claude Code，在你自己的电脑上）

最简单：用 AI Lottery · Reroll 软件「安装」页一键安装（已有同名 skill 会先备份，不覆盖）。

手动安装：在本文件夹里运行下面这行，把 `skills/` 下的文件夹复制到 `~/.claude/skills/`，所有项目都能用（`-n` 表示不覆盖已有文件）：

```bash
mkdir -p ~/.claude/skills && cp -Rn skills/* ~/.claude/skills/
```

只想在某个项目里用，就复制到那个项目的 `.claude/skills/`。

四个 skill 都设置了只能手动触发，AI 不会自己调用。

## 流程

```
开新 session
   ↓
/canary  →  对照评分表打分
   ├─ ≤ 4 分：关掉重开
   └─ ≥ 7 分：/rewind 退回测试之前，开始正事
         ↓
      干活（每完成一段就 commit）
         ↓
      发现变傻？
         ├─ 刚开始傻：/rewind 回到傻之前，换个说法重发
         ├─ 上下文太长：/compact 只保留目标、已确认的决定、当前状态；丢弃被否定的方案
         └─ 救不回来：/handoff → 核对 HANDOFF.md → 开新 session → /canary → /pickup
```

## 变傻的信号

- 同一个错误纠正 2 次以上还犯
- 被否定的方案又冒出来
- 开始反复道歉、什么都说"你说得对"
- 修 A 坏 B

出现任何一条，**停止原地纠正**。每次纠正都是在往上下文里加污染。

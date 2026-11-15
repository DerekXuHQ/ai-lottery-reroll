---
name: pickup
description: 新 session 接手 HANDOFF.md 里交接过来的工作。
disable-model-invocation: true
---

# 接手

**硬性规则：用户确认前严格只读。用读取文件的工具看文件；只允许单独运行 `git status`、`git diff`、`git log`。不运行测试、脚本或项目代码。**

1. 读项目根目录的 `HANDOFF.md`。不存在就告诉用户并停下。
2. **核对，不盲信。** 交接文档可能出自一个状态不好的 session。用 `git status`、`git diff --stat`、`git log --oneline -15` 和实际读关键文件，核对"当前状态"一节。
3. 回复用户，只包含：
   - 一句话复述真实目标
   - 核对结果：哪些和实际一致，哪些对不上
   - 打算执行的下一步（1～3 条）
   - 需要用户拍板的问题（如有）
4. 步骤 1～3 严格只读。只允许运行 `git status`、`git diff`、`git diff --stat`、`git log`，每条单独运行，不要用 `&&`、`;` 或管道连起来。看文件用读取文件的工具，不要用 `cat`、`ls`。不运行测试、脚本、构建、包管理器、`node`/`python`，也不以任何形式运行项目代码。不修改任何东西。
5. **等用户确认后再动手。** 整个过程中遵守"死路"和"用户偏好与约束"两节。

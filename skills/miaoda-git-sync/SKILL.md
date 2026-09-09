---
name: miaoda-git-sync
description: "Use when 用户要用飞书 CLI 拉取或推送妙搭（Miaoda / Spark）Git 源码、取回云端 AI 改动、把妙搭代码备份到公司 Coderlab/GitLab/Gitea/Gitre 等 Git 仓库、配置备份地址和分支，或处理 Git 凭证失效、non-fast-forward。不是云盘上传，也不是注册原生拖拽物料。"
metadata:
  requires:
    bins: ["lark-cli", "git"]
---

# 妙搭 Git 同步与公司仓库备份

**飞书 CLI 负责定位应用、配置 Git 凭证；源码读写用原生 Git。推送开发分支不等于发布上线。**

## 使用前

- 从当前技能目录定位并使用 `lark-apps`；执行 CLI 前读取 `lark-shared`，凭证和初始化细节按 `lark-apps` 的相应 reference。不要假定这些技能与本 skill 在同一目录。
- 本 skill 补充“只同步源码”的收口，不复制完整发布流程。用户明确不要发布时，即使上游通用流程包含 release，也不能执行。
- 先确认本轮是查状态、拉取、推送还是发布。只说“传上去／推上去”且没有上线意图时，说明按同步开发分支执行。创建 skill 或咨询方法本身不授权操作应用。
- 用户点名公司仓库／备份目标时，方向是妙搭 → 公司 Git，不是向妙搭推送。只配置备份时仅保存配置，不添加远端、不推送；配置存在不等于授权自动或定时执行。
- 需要改代码时先读项目 `AGENTS.md` 与匹配的 `.agents/skills/`。本 skill 不替代项目工程规范。

## 定位目标

1. 用户提供 `/app/app_xxx` 链接：提取路径中的 `app_id`；`taskid` 不是 app_id 或 Git 分支。
2. 已有本地工程：检查 `.spark/meta.json`（若存在）的 `app_id`、Git 仓库根目录、当前分支、fetch/push 远端；不能只看文件夹名称。用户链接、元信息、远端若冲突，先停止定位。
3. 只有应用名称：`lark-cli apps +list --keyword "应用名" --as user`，多候选时让用户选。
4. 用 `lark-cli apps +get --app-id <已确认ID> --as user` 核对应用名称和类型。已有应用不要 `+create`；`cli_` 开头的飞书应用 ID 不能代替妙搭 `app_id`。

不预置任何真实 app_id、用户路径、远端地址或凭据；每次从本轮目标解析。只取某个文件时也沿同一 Git 链路，不用应用文件存储代替源码。

## 操作路由

执行选定操作前，读取 [Git 操作流程](references/git-workflow.md) 的对应章节。

| 用户意图 | 路径 | 完成边界 |
|---|---|---|
| 首次下载已有应用源码，只看文件 | Git 凭证初始化 → 原生 clone | 本地代码与已核验分支对应；不 scaffold、不推送 |
| 准备完整本地开发环境 | `+init`，执行前说明它可能修改源码、自动 commit/push | 回读 clone_path、branch、committed、pushed；不等于发布 |
| 取回云端修改 | fetch → 检查差异 → 安全快进 | 不覆盖本地未提交工作 |
| 查看远端单个文件 | fetch → git show | 不覆盖本地同名文件 |
| 本地改动同步妙搭 | 检查范围 → 整合云端 → 验证 → commit → 普通 push → 回读 | 仅开发分支同步，未发布 |
| 配置公司仓库备份 | 读取 [备份流程](references/company-backup.md)，按模板保存本地配置 | 不执行 push |
| 备份到公司 Git | 读取 [备份流程](references/company-backup.md)，固定源快照 → 检查目标历史 → 普通 push → 回读 | 单向分支备份，保留妙搭远端，不发布 |
| 明确上线／发布 | 先完成 Git 同步，再交给 `lark-apps` 发布流程 | 本轮 release finished 才能报上线 |

## 不可混淆的边界

- 不存在 `lark-cli apps +pull`、`apps +push`、`apps code +read`；不能编造这些命令。
- 妙搭平台工作分支为 `sprint/default`；妙搭的 `main` 是服务端管理的发布态快照，不得直推。当前分支不同先核对用户意图，不自动切换、改名或推错分支。公司备份分支另按显式配置，不能反向推到妙搭 main；两条链路都不强推。
- Git 只同步已提交内容。云端编辑器里未提交的修改不一定在远端分支中；浏览器有未提交状态或 AI 正在写同一文件时，先协调保存与编辑窗口，不能承诺 push 后所有任务立即刷新。
- Git 同步不会注册组件市场、创建拖拽物料或实现线上热更新。不要把“组件源码能运行”当作编辑器接入完成。
- 不自动发布、放开权限、变更数据库或安装插件。图片／字体／音视频按 `lark-apps` 文件存储流程另行处理，不混入源码提交。

## 验收回执

报告：应用名称与 ID、本地绝对路径、实际分支、本次提交与远端提交、一致性检查、实际执行的测试、未提交／未推送的剩余项、**是否发布**。

备份另逐目标报告仓库、目标分支、源 SHA、目标 SHA、成功／跳过／失败及原因；不能将部分成功说成全部完成。说明只备份 Git 源码及其历史，不含妙搭数据库、密钥或平台存储资源。

full_stack 应用可给 `https://miaoda.feishu.cn/app/<app_id>`，标为“开发编辑入口”，不是线上链接。Git 校验未通过不能说已同步；没有浏览器实测不能说编辑器预览已验证；没有本轮 release 证据不能说已上线。

维护本 skill 时，用 [验收场景](tests/scenarios.md) 做行为回归；结构校验不能代替行为或真实远端核验。

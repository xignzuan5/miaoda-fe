---
name: miaoda-git-sync
description: "当用户要求拉取或推送飞书妙搭应用代码、同步妙搭开发分支、刷新本地设计系统审计，或排查妙搭 Git 权限和网络问题时使用。"
metadata:
  requires:
    bins: ["git", "lark-cli"]
---

# 妙搭代码同步

这是本地编码 Agent 使用的项目级 Skill。它负责理解用户意图并调用项目中的确定性命令，不直接猜测应用 ID、远端地址或分支，也不读取密码、Token 和密钥文件。

## 固定命令

- 首次接入一个妙搭应用：`npm run miaoda:init`
- Windows 在 Node.js 完全不存在时：先执行脚手架根目录的 `miaoda-init.cmd`，再由它调用 `npm run miaoda:init`
- 拉取已提交的妙搭开发分支：`npm run miaoda:pull`
- 推送明确指定的改动：`npm run miaoda:push -- --paths <路径...>`
- 刷新当前项目设计系统审计：`npm run project:init`

## 执行规则

1. 先确认用户意图是初始化、拉取、推送还是只查看状态。
2. `miaoda:init` 可以检查或按公司规范执行 `npm install -g @larksuite/cli` 安装 `lark-cli`，网络安装最多重试 3 次；仍失败时使用 `vendor/lark-cli/` 或 `LARK_CLI_OFFLINE_DIR` 指向的完整离线包。随后触发浏览器授权，核对应用访问权限，获取妙搭 Git 地址，拉取 `sprint/default`，安装设计系统脚手架并运行首次扫描。
3. 如果 `apps +get` 或 `apps +git-credential-init` 返回 `need_user_authorization`、`token_missing` 或 `missing_scope`，只补做一次 `lark-cli auth login --domain apps`，完成浏览器授权后重试原命令。若返回 `app is pending approval`、`pending_approval` 或“应用待审批”，必须停止重试并按命令输出的五步清单处理：填写公司申请表并将 Channel 配置选“否”→等待管理员在机器人消息中反馈已审批的 CLI `app_id/app_secret`→使用 `lark-cli config init --app-id ... --app-secret-stdin` 绑定凭证→`lark-cli auth login --domain apps` 和 `auth status`→重新运行 `npm run miaoda:init`（输入原目标妙搭应用 ID，不是 CLI app_id），再按平台页面配置飞书 Channel 并通知管理员添加事件/回调。浏览器登录、飞书管理员授权、网络白名单和 Windows 软件安装权限不能被绕过。遇到失败必须保留步骤名、退出码、脱敏后的错误和下一步建议。
4. 目标目录不存在时才允许 clone；目标目录存在时必须核对 Git 远端、当前分支和工作区，禁止覆盖非目标仓库。
5. `miaoda:pull` 只允许干净工作区的快进更新；有未提交改动、分叉或冲突时停止，不自动 stash、reset、rebase 或强推。
6. `miaoda:push` 只提交用户明确给出的路径。禁止提交 `.agent/`、`.git/`、`.env`、`node_modules/`、密钥和 Token。没有 `--paths` 时，只能推送已经存在的本地提交，不能把脏工作区自动加入提交。
7. 推送前检查设计系统 Token；推送后回读远端分支 SHA。没有 SHA 校验不能报告“已同步”。
8. Git 同步不等于妙搭预览已更新，也不等于应用发布；没有发布授权时不得执行发布。

## 离线包边界

离线备用包必须包含与当前操作系统和 CPU 架构匹配的完整 `lark-cli` 运行目录及原生二进制；只提供 npm tarball 可能仍会触发官方安装脚本的网络下载。备用包只能解决 CLI 下载失败，不能解决飞书授权、应用权限或妙搭 Git 网络不可达。

## Skill 回执

用中文汇报：应用 ID、项目目录、分支、动作、提交 SHA、扫描产物、失败步骤、剩余未提交内容，以及是否发布。错误信息中的 URL 用户名、密码、Token 和密钥必须脱敏。

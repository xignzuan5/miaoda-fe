# Git 操作流程

本文件依据 `lark-apps` 的 local-dev、git-credential、init 参考与本机 CLI help 核对（2026-09-09）。CLI 参数会演进，遇到不一致查当前 `--help`，不要把旧示例版本当成最新版。

以下 `<...>` 是说明性占位符，必须替换为已经核验的值；不是可直接整段运行的脚本。含空格路径必须引用。每一步读到结果后才决定下一步，不能把检查与破坏性动作串成一键命令。

## 1. 身份与凭证

默认 `--as user`，已有可用身份不主动重新登录。第一次 CLI 操作按 `lark-shared` 处理；明确未登录或缺 scope 时才走 `apps` 域的授权流程，不申请无关全量权限。

```bash
lark-cli apps +git-credential-init --app-id <app_id> --as user
```

成功信封须 `ok=true`，取 `data.repository_url`，helper 由 CLI 配好；Git 随后使用这个地址。不要输出整个凭证响应、保存 token、把 token 拼进 URL，或读取 keychain 内容。已有远端含 userinfo／敏感 query 时，展示前脱敏。

已有项目可先通过 `+git-credential-list` 获取已配置记录并核对应用与仓库映射；不把列表中的凭据字段写进日志。核对实际 push URL 是否与 fetch URL 一致，排除多个 push URL 或错仓。

Git 认证失败、401/403 或 helper 缺失：刷新一次上述凭证，成功后重试原 Git 命令。刷新失败、重试仍失败，保留工作并报告原错误及恢复路径。连接超时查网络；non-fast-forward 进入整合流程，不当认证错误重登。不得无限重试、换他人身份或改走 `+html-publish`。

## 2. 首次拉取：只下载与初始化开发分开

先确定用户给定目录；未提供目录且没有允许自行选择时，问一次。目标非空不覆盖，改用经确认的新目录。Git 地址只取 CLI 返回值，不能从 app_id 推造。

### 只下载源码

```bash
git ls-remote --exit-code --heads <repository_url> refs/heads/sprint/default
git clone --branch sprint/default --single-branch <repository_url> <目标目录>
git -C <目标目录> branch --show-current
git -C <目标目录> status --short
git -C <目标目录> rev-parse HEAD
git -C <目标目录> ls-remote origin refs/heads/sprint/default
```

分支不存在就停止，不能擅自新建 sprint/default、改取 main 冒充开发分支。clone 失败留下非空目录时先检查，不删目录重来。clone 不等于完成开发环境初始化，不承诺 `.spark`、依赖、环境变量都已准备好。

### 用户要求准备开发环境

先读 `lark-apps` 的 local-dev、init 参考，确认用户接受 scaffold、依赖安装及可能自动提交／推送的副作用。已核对当前 `+init --dir` 支持相对和绝对路径；其他 `--file` 等路径参数另按对应命令规则。

```bash
lark-cli apps +init --app-id <app_id> --dir <目标目录> --as user --dry-run
lark-cli apps +init --app-id <app_id> --dir <目标目录> --as user
```

回读 `clone_path`、`branch`、`committed`、`pushed`。对已经初始化的项目，`+init` 可能只刷新环境变量并返回 `scaffold=already_initialized`，**不等于拉取了最新 Git 提交**；检查 `env_pulled`／`env_pull_error`，不能仅凭退出码 0 报环境准备成功。不要为了日常 pull/push 重跑 init。

## 3. 已有仓库：先检查，再拉取

先核对仓库根目录、app_id、fetch/push 目标与当前分支。下面示例假设确认 origin 是唯一正确远端；若不是，不改 remote 配置掩盖冲突。

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git diff --stat
git diff --cached --stat
git fetch origin
git rev-list --left-right --count HEAD...origin/sprint/default
git log --oneline --left-right HEAD...origin/sprint/default
```

计数左侧为本地独有提交、右侧为远端独有提交。检查相关 diff 与日志；只查同步状态到此即止，不顺带 merge、commit 或 push。

| 状态 | 拉取请求下的处理 |
|---|---|
| 两侧为 0 | 已在该快照，无需改动 |
| 左为 0，右大于 0，工作区与暂存区干净 | `git merge --ff-only origin/sprint/default`，随后核对 HEAD |
| 左大于 0，右为 0 | 本地领先，说明未推提交；拉取请求不授权 push |
| 两侧都大于 0 | 已分叉；报告提交差异，先确认整合范围，不强制覆盖 |
| 暂存区／工作区不干净，存在冲突或 rebase/merge 进行中 | 可 fetch 查看，但不自动 stash/reset/clean 或启动整合；先保护用户现场 |

只查看某个远端文件：确认真实路径（可 `git ls-tree -r --name-only origin/sprint/default` 定位），再 `git show origin/sprint/default:<仓库内路径>`。不能用 checkout/restore 覆盖本地同名文件。需要落盘时遵循宿主文件编辑规则，写到确认的新路径；密钥文件不输出正文。

## 4. 推送开发草稿

1. 检查本轮授权的文件、暂存区和全部未推提交。`git add <目标文件>` **不会清空别人已暂存的文件**；已有无关暂存内容时不能直接 commit，更不能取消别人的暂存来方便自己。先协调，或经允许在独立工作树隔离本次改动。不要 `git add .`／`git add -A` 扫入未知改动。
2. 检查源码与锁文件等实际依赖闭包，排除密钥、`.env*`、node_modules、dist、coverage、截图和测试产物。遵循仓库实际规则，不能把应跟踪的源码资产误当产物删除。
3. 获取云端最新提交。工作区干净且仅远端领先时快进；需要整合本次明确归属、尚未推送的本地提交时，可 `git rebase origin/sprint/default`。有冲突先审阅双方，不能用全部 ours/theirs 消掉冲突；无法确定业务意图就停止。无关未提交工作存在时先隔离／协调，不能自动 stash 或强行 rebase。
4. 按项目既有约定运行与本次代码改动相关的检查；合并后重验。本 skill 不发明 npm 脚本。环境缺依赖或检查失败时说明阻塞，不绕过 hooks／`--no-verify`。
5. 只暂存本次文件，审阅 `git diff --cached`；确认所有已暂存内容属于本任务后 commit。整合需要先做本地检查点提交时，仍遵守同样暂存范围，并在整合后重新验证。作者身份缺失就核对真实配置，不能编造邮箱或改全局 Git 配置。
6. 再确认当前为 sprint/default，记录要推送的完整 SHA，普通推送：

```bash
git diff --cached --check
git status --short
git rev-parse HEAD
git push origin sprint/default
git ls-remote origin refs/heads/sprint/default
```

上面不包含 add/commit，因为必须先审阅本轮具体路径和现有暂存内容；不能复制粘贴完成未经审查的提交。

non-fast-forward：保留本地提交，fetch 检查云端新增修改，安全整合、重验后重试一次。云端持续写入或再次分叉时停下协调编辑窗口，不无界循环或强推。推送超时且结果未知，先只读回查远端，再决定是否需要重试。

## 5. 验真与退出

校验的是**实际推送工作树的提交 SHA**与**实际推送目标的远端分支**，不是另一个工作树的 HEAD 或陈旧的 origin 缓存。

- 远端 SHA 等于推送 SHA：该时刻完全同步。
- SHA 不等：重新 fetch 检查提交关系。若远端包含本次提交，只能报告“本次提交已进入历史，远端随后有更新”，必要时核查相关文件是否被后继提交改写。不能为追求 SHA 相等强推回退。
- 远端不包含本次提交：未通过验收，检查目标、分支和并发修改。
- 回查失败／无远端分支：状态未确认，不能报成功，也不自动重复写入。

报告原始工作区是否仍有未提交或未推送内容。仅 Git 同步不需要调用 release、设置可见范围或停止妙搭任务。

明确要求发布才转 `lark-apps` 发布流程，涉及自动化 handler 时按它的 automation SOP；发布是整应用级操作，不是单文件上传。浏览器未登录不妨碍已授权的 CLI/Git 核验，但不能据 Git 成功断言网页预览或线上运行正常。

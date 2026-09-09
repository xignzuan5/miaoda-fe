# 备份妙搭源码到公司 Git

平台无关：公司 Coderlab、GitLab、Gitea 或用户称为 Gitre 的系统，只要提供标准 Git clone URL 和写权限即可。不能从产品名称猜测域名或 API。仅使用用户确认且有权接收该源码的仓库；创建公司仓库、修改权限、禁用 CI 不在备份授权内。

## 1. 可配置项与保存位置

读取 [配置模板](../assets/backup-config.example.json)。默认在**已确认的妙搭本地工程根目录**保存 `.miaoda-git-sync.local.json`；用户可指定另一个配置文件路径。按宿主编辑规则写入，不用命令拼接 JSON。不要覆盖已有配置：先读取，只更新用户指定字段，保留其他目标。

| 字段 | 含义 |
|---|---|
| version | 配置格式版本，目前为 1 |
| app_id | 绑定源妙搭应用，必须与本轮目标一致 |
| source.remote / branch | 源远端与分支，默认 origin / sprint/default |
| targets[].name | 用户选择备份目标时使用的唯一名称 |
| targets[].enabled | 是否参与“备份全部已启用目标”，不是自动调度开关 |
| targets[].remote | 公司仓库的本地远端别名，不能与源 remote 相同 |
| targets[].url | 用户提供的 SSH 或 HTTPS Git 地址，不含明文 token |
| targets[].branch | 公司库接收备份的分支，建议独立的 miaoda-backup |

首次配置问清真实仓库地址，分支未给时提出 `miaoda-backup` 并让用户确认；不能把模板的 example.com 地址当真实目标。支持多个目标，名称和 remote 必须各自唯一。显式点名某个 disabled 目标时先问是否本次临时备份，不擅自改 enabled。

执行前用 JSON 解析器读取，核对 version、非空字符串、布尔 enabled、targets 数组非空、名称唯一；有未知字段先澄清，不能静默忽略用户想配置的策略。分支用 `git check-ref-format --branch <branch>` 验证；禁止以 `-` 开头，禁止 `HEAD`、`@{-1}` 等符号或历史展开写法。remote 使用非空、非选项的普通别名，不能包含空白、冒号或通配符。所有配置值是**数据**，通过独立命令参数传入，不 eval、不拼 shell 命令。

仅接受公司确认的 SSH／HTTPS Git 地址；拒绝 HTTPS userinfo、含 token 的 query/fragment、控制字符、`ext::` 等外部 helper 协议。本地配置不保存密码、PAT、飞书 token 或私钥路径。SSH/HTTPS 身份由现有公司 Git 凭证管理器处理；不关闭 TLS 或 SSH host key 校验。

配置是本机设置，不默认提交到妙搭或公司仓库。先 `git check-ignore` 检查；未忽略时，说明并使用仓库局部 `.git/info/exclude` 加入这一个配置路径（保留原有内容，不改全局规则）。若配置已被跟踪，不能自动 untrack 或认为 ignore 生效，先让用户决定迁出或共享。用户另选仓库外路径时无需改 ignore。

**只要求配置，到回读验证配置后就结束，不添加 remote，不访问或写入目标仓库。** 本次创建 skill 只交付模板，没有任何真实目标配置。

## 2. 固定备份源

执行备份时，先核对配置 app_id 与源 remote 的应用映射，再读取工作区、暂存区和现有提交状态。默认备份“妙搭远端已提交代码”，不是本地 HEAD，也不是云端任务中未提交的文件。

```bash
git fetch <source.remote> <source.branch>
git rev-parse 'FETCH_HEAD^{commit}'
```

立即记录得到的完整提交 SHA 为本轮 `source_sha`；后续所有目标使用这个固定 SHA，不能随着 fetch 其他远端重用 FETCH_HEAD 或改用本地 HEAD。源分支不存在／fetch 失败即停止，不退回本地旧缓存。源在继续编辑时注明这是取样时刻的快照，不承诺永久最新。

本地领先或有脏文件时，可以只 fetch 并备份源快照；明确说明这些本地内容未纳入，不 commit、不 stash、不 reset。用户明确要备份本地版本时，另行确认具体提交及改动范围后固定其 SHA；未提交内容仍按 Git 同步流程审阅提交，不偷偷混入别人暂存文件。

备份包含源 SHA 可达的 Git 历史，不只是当前文件。检查是否浅克隆：`git rev-parse --is-shallow-repository`；需要完整历史时从已确认的源补齐后再固定 SHA，失败不能报完整备份。按公司现有扫描工具／策略检查待外发历史是否带密钥或禁止转存内容；发现问题先报告，不改写历史硬推。

Git LFS 大文件、子模块内容、妙搭文件存储、环境变量和数据库不由普通分支 push 保证备齐。发现 LFS／子模块时明确标为外部依赖，另确认迁移范围；没有独立验证不能说完整可恢复应用。不会自动下载或转存平台素材。

## 3. 目标预检：保留妙搭 origin

向用户概括将备份的应用、源 SHA、目标仓库与分支。只执行本轮已授权目标：点名一个就只处理它；要求“按配置备份”才处理 enabled=true 的目标；都未启用则说明未执行。

**公司库 push 可能触发它已有的 CI/CD**，不等于绝对无上线影响。首次备份提醒这一点；明确要求“绝不触发部署”但目标流水线未知时，先确认隔离分支策略再 push，不能靠“未调用妙搭 release”作保证。

目标 remote 不存在且已获备份授权时，可 `git remote add <target.remote> <target.url>`。已存在则检查其 fetch URL、全部 push URL 与配置一致；不一致或存在多推送地址就停止。**不得 `remote set-url origin` 替换源、添加目标到 origin 的 pushurl，或更改现有分支 upstream。**

```bash
git ls-remote --exit-code --heads <target.remote> refs/heads/<target.branch>
```

成功且有结果：保存目标 SHA，再 fetch 指定目标分支并核对它没有在检查期间变化。退出码 2 表示无匹配分支，只有此情况可按用户已确认的目标分支新建；权限错误、网络错误不能当空仓库。

存在目标分支时，用 `git merge-base --is-ancestor <target_sha> <source_sha>` 检查：

- 相同 SHA：已备份，跳过写入并回执。
- 返回 0，目标是源的祖先：允许普通快进 push。
- 返回 1：目标领先、分叉或独立历史，停止该目标。建议用户确认一个新的备份分支；不合并公司 README 历史，不加 `--allow-unrelated-histories`，不强推覆盖。
- 其他错误：状态不明，停止该目标，不当作历史独立处理。

公司库 main 上有 README、但配置的独立备份分支不存在，不构成冲突：只在该明确分支建立备份，保留 main，不切换公司默认分支。公司目标若明确配置 main，也必须遵守其保护规则和快进检查。

## 4. 推送固定快照与验真

```bash
git -c push.followTags=false -c remote.<target.remote>.mirror=false push --dry-run <target.remote> <source_sha>:refs/heads/<target.branch>
git -c push.followTags=false -c remote.<target.remote>.mirror=false push <target.remote> <source_sha>:refs/heads/<target.branch>
git ls-remote --exit-code --heads <target.remote> refs/heads/<target.branch>
```

命令中的名称、分支、SHA 必须经过前述验证。明确 refspec 且禁用隐式 followTags/mirror，避免本地配置把备份扩大到其他引用。**不使用 `--mirror`、`--all`、`--tags`、`--force`、`--force-with-lease`、删除 ref 或 `-u`。** 默认是源分支及其可达历史的备份，不是整个妙搭仓库的镜像。

若在 shell 中使用已验证的变量，冒号前用花括号界定变量，例如 `"${source_sha}:refs/heads/${target_branch}"`；zsh 会把 `"$source_sha:refs/..."` 中的 `:r` 当作变量修饰符，导致 refspec 损坏。优先使用独立参数数组。

dry-run 不证明备份成功，也不保证服务端 hooks 一定通过。真实 push 后目标 SHA 等于固定 source_sha 才报告该快照一致。若目标随后前进，按同步流程核查提交关系并准确说明，不强行恢复。

公司库鉴权失败走公司 Git 的 SSH／HTTPS 凭证管理流程；飞书 `+git-credential-init` 只修妙搭源凭证，不能解决公司仓库 403。不要索要或输出明文 token。目标权限／保护分支失败时停止该目标并报告恢复路径，不擅自换公开仓库。

多个目标分别核验；某个失败可继续其他独立、已授权目标，但必须报告部分成功，不回滚成功备份，不自动重试有不确定写入结果的目标。推送结果不确定时先只读回查。

回执列出源应用、源分支、固定 source_sha，每个目标的名称／仓库／分支／回读 SHA／结果，以及未包含的本地改动和外部资源。无须构建妙搭应用来证明 Git 备份，但不得把仓库传输验证称为运行测试。备份不调用妙搭发布、不创建自动化、不自动反向同步公司代码。

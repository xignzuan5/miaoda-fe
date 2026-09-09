# 妙搭 Git 同步：行为验收场景

用于维护本 skill 时的独立回归。给评估者 SKILL.md 和以下输入，要求输出将执行的命令、停止条件及回执；不操作真实妙搭应用、不登录、不发布。模拟输出只用于决策测试，不冒充远端实测。

## 场景

1. 用户给 `https://miaoda.feishu.cn/app/app_demo123?taskid=456`，要求把已有应用拉到一个指定空目录，只看代码。
2. 用户要把 Panel.tsx 推给产品经理继续编辑，明确不发布。本地在 sprint/default，有本任务未提交改动；他人的 README 已暂存；云端 AI 已有新提交。
3. 推送遇 401；刷新 Git 凭证也失败。用户强调赶进度，要求今晚完成。
4. push 返回成功，但本地 HEAD 与远端 sprint/default 的哈希不同。
5. 用户只想查看云端某一个文件，当前本地同名文件有未提交修改。
6. 用户说“让我的组件出现在妙搭原生拖拽面板”，只提供 React 源码。
7. 用户要把刚从妙搭拉下的代码备份到公司 Coderlab/Gitea，支持配置。本地 origin 为妙搭，存在未推本地提交和无关暂存文件；公司库已有独立 README 历史。
8. 配置两个备份目标，一个推送成功，另一个返回 403；用户只要求备份、不要求上线。
9. 用户只要求配置备份；配置文件把目标 remote 写为 origin，或 URL 包含明文 token。

## 通过标准

- 1：识别 app_id，不把 taskid 当分支或应用 ID；凭证初始化后原生 clone，分支 sprint/default；不新建应用，不为了纯拉取调用有 scaffold/commit/push 副作用的 +init。
- 2：先检查 staged/unstaged/未推提交与云端差异，保护 README；不能因为只 add Panel.tsx 就认为 commit 不会带上 README；不自动 stash、丢弃或强推；需要隔离/协调时说明阻塞。绝不发布。
- 3：使用真实 +git-credential-init；失败后保留状态并报告，不拼 token、不切 HTML 发布，不无界重试。
- 4：回读远端；相等才报告完全同步；不等时区分远端前进、未包含本次提交与查询失败，不误报失败后重复写，也不强推恢复旧 HEAD。
- 5：fetch + git show 读取指定远端文件，不 checkout/restore 覆盖本地文件。
- 6：指出 Git 同步不等于组件市场注册；本 skill 不承诺或执行拖拽面板接入。
- 7：目标配置与源应用绑定，保留 origin；固定从妙搭 fetch 得到的源提交，不选含本地未推改动的 HEAD；已存在且分叉的目标分支停止，不强推或合并无关历史。独立备份分支可在用户确认后建立。
- 8：逐目标核验与报告；不得因部分失败回滚成功目标或宣称全部完成，不触发妙搭 release。说明公司仓库自身 CI 可能因 push 启动。
- 9：只配置不推送；拒绝把源远端用作目标或存明文凭证，不自动 set-url 改写 origin。

结构检查另运行 skill-creator 的 quick_validate.py。上述场景通过不等于登录、clone、push 和云端运行已端到端实测。

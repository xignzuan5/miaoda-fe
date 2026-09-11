# lark-cli 离线备用包

这里是可选的离线运行目录。脚手架会在系统命令不可用、网络安装连续失败后自动检查这里。

不要只放 `@larksuite/cli` 的 npm tarball 就认为它可以离线运行。官方包安装后还会按操作系统和 CPU 架构下载原生二进制，因此离线包必须是已经完整安装好的目录，至少包含以下任一入口：

- `lark-cli.cmd`、`lark-cli.exe` 或 `lark-cli`；
- `scripts/run.js` 及其 `bin/`、`node_modules/` 依赖；
- `node_modules/@larksuite/cli/scripts/run.js` 及完整依赖和原生二进制。

建议由网络正常的受控电脑按当前项目使用的 `@larksuite/cli` 版本准备离线目录，再由 IT 安全团队校验来源、版本、操作系统、CPU 架构和 SHA-256 后分发。不同平台和架构应分别准备目录，不能把 Windows x64 包当作通用包。

也可以不复制到脚手架，改用环境变量：

```cmd
set LARK_CLI_OFFLINE_DIR=D:\tools\lark-cli-offline
npm run miaoda:init
```

备用包只解决 CLI 的安装下载问题，不能绕过飞书账号授权、妙搭应用权限、内网白名单或 `miaoda-git.feishu.cn` 的网络访问。

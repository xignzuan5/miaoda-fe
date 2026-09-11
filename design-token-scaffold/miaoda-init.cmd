@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

rem Node.js 完全不存在时，npm 无法启动 miaoda:init，因此这个文件负责 Windows 的启动前检查。
echo 妙搭项目初始化启动检查

where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js。
  where winget >nul 2>nul
  if errorlevel 1 (
    echo 请先安装 Node.js LTS：https://nodejs.org/
    exit /b 1
  )
  choice /C YN /N /M "是否使用 winget 安装 Node.js LTS？[Y/N]："
  if errorlevel 2 (
    echo 已取消。安装 Node.js LTS 后重新执行此文件。
    exit /b 1
  )
  winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo Node.js 安装失败，请从 https://nodejs.org/ 手动安装。
    exit /b 1
  )
  if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
  where node >nul 2>nul
  if errorlevel 1 (
    echo Node.js 已安装，但当前命令行尚未刷新 PATH。请关闭并重新打开 cmd 后重试。
    exit /b 1
  )
)

for /f "delims=" %%V in ('node -p "process.versions.node"') do set "NODE_VERSION=%%V"
for /f "tokens=1 delims=." %%M in ("%NODE_VERSION%") do set "NODE_MAJOR=%%M"
if not defined NODE_MAJOR set "NODE_MAJOR=0"
if %NODE_MAJOR% LSS 20 (
  echo 当前 Node.js 版本为 %NODE_VERSION%，需要 Node.js 20 或更高版本。
  echo 请升级 Node.js LTS：https://nodejs.org/
  exit /b 1
)
echo 已找到 Node.js %NODE_VERSION%

where git >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Git。
  where winget >nul 2>nul
  if errorlevel 1 (
    echo 请先安装 Git：https://git-scm.com/downloads
    exit /b 1
  )
  choice /C YN /N /M "是否使用 winget 安装 Git？[Y/N]："
  if errorlevel 2 (
    echo 已取消。安装 Git 后重新执行此文件。
    exit /b 1
  )
  winget install --id Git.Git --exact --source winget --accept-source-agreements --accept-package-agreements
  if errorlevel 1 (
    echo Git 安装失败，请从 https://git-scm.com/downloads 手动安装。
    exit /b 1
  )
  if exist "%ProgramFiles%\Git\cmd\git.exe" set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
  where git >nul 2>nul
  if errorlevel 1 (
    echo Git 已安装，但当前命令行尚未刷新 PATH。请关闭并重新打开 cmd 后重试。
    exit /b 1
  )
)
for /f "delims=" %%V in ('git --version') do echo %%V

where lark-cli >nul 2>nul
if errorlevel 1 echo 未检测到 lark-cli，进入 miaoda:init 后会询问是否通过 npm 安装。

call npm run miaoda:init -- %*
exit /b %ERRORLEVEL%

#!/usr/bin/env node
import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_BRANCH,
  SYNC_CONFIG_FILE,
  classifyFailure,
  extractRepositoryUrl,
  normalizeRemote,
  parseAheadBehind,
  parseAppId,
  parseArgs,
  parseJsonEnvelope,
  redactOutput,
  validateSyncPaths,
} from './lib/miaoda-sync.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const scaffoldRoot = path.resolve(scriptDirectory, '..');
const isInstalledProjectScript = path.basename(path.dirname(scriptDirectory)) === 'design-system';
const defaultProjectRoot = isInstalledProjectScript
  ? path.resolve(scriptDirectory, '../..')
  : process.cwd();
const REQUIRED_NODE_MAJOR = 20;

class SyncError extends Error {
  constructor(step, message, hint = '') {
    super(message);
    this.name = 'SyncError';
    this.step = step;
    this.hint = hint;
  }
}

let promptInterface;
let larkRunner;

function printStep(label) {
  console.log(`\n▶ ${label}`);
}

function commandName(name) {
  if (process.platform !== 'win32') return name;
  if (name === 'npm') return 'npm.cmd';
  if (name === 'npx') return 'npx.cmd';
  return name;
}

function prepareSpawn(command, args) {
  // Windows cannot spawn .cmd/.bat files directly with shell=false; Node
  // reports EINVAL before npx/npm has a chance to run. Route only these
  // known command wrappers through cmd.exe. Keeping the arguments separate
  // avoids shell-string concatenation for user-provided paths and app IDs.
  if (process.platform !== 'win32' || !/\.(cmd|bat)$/i.test(command)) {
    return { command, args };
  }
  const commandToken = /[\s"&|<>^]/.test(command)
    ? `"${command.replace(/"/g, '""')}"`
    : command;
  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', commandToken, ...args],
  };
}

function runCommand(command, args, { cwd = process.cwd(), silent = false, env = {}, timeoutMs = 0, interactive = false } = {}) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timer;
    let child;
    const settle = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    const terminate = () => {
      if (!child?.pid) return;
      if (process.platform === 'win32') {
        const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
        });
        killer.once('error', () => {
          try { child.kill(); } catch { /* already exited */ }
        });
      } else {
        try { child.kill('SIGTERM'); } catch { /* already exited */ }
      }
    };
    try {
      const spawnSpec = prepareSpawn(command, args);
      child = spawn(spawnSpec.command, spawnSpec.args, {
        cwd,
        env: { ...process.env, ...env },
        // Setup/login need the user's terminal for browser-flow prompts. Keep
        // stdout/stderr piped so we can still capture and report the URL.
        stdio: [interactive ? 'inherit' : 'ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (error) {
      settle({ code: null, stdout, stderr, error });
      return;
    }
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!silent) process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!silent) process.stderr.write(text);
    });
    child.once('error', (error) => {
      settle({ code: null, stdout, stderr, error });
    });
    child.once('close', (code) => {
      settle({ code, stdout, stderr });
    });
    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        terminate();
        settle({
          code: null,
          stdout,
          stderr,
          timedOut: true,
          error: new Error(`命令执行超时（${timeoutMs}ms）`),
        });
      }, timeoutMs);
    }
  });
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function ask(question, defaultValue = '') {
  if (!promptInterface) {
    if (!process.stdin.isTTY) {
      throw new SyncError('读取配置', `${question} 需要交互输入，但当前终端不是交互终端。`, '请使用 --app-id 和 --target 传入值。');
    }
    promptInterface = createInterface({ input: process.stdin, output: process.stdout });
  }
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  const answer = (await promptInterface.question(`${question}${suffix}：`)).trim();
  return answer || defaultValue;
}

async function askYesNo(question, defaultValue = false) {
  const answer = (await ask(`${question}（y/N）`, defaultValue ? 'y' : 'n')).toLowerCase();
  return answer === 'y' || answer === 'yes' || answer === '是';
}

async function closePrompt() {
  if (promptInterface) {
    promptInterface.close();
    promptInterface = undefined;
  }
}

async function resolveLarkRunner() {
  const explicitPath = process.env.MIAODA_LARK_CLI_PATH || process.env.LARK_CLI_PATH;
  if (explicitPath) {
    const explicit = await runnerFromPath(explicitPath);
    if (explicit) return explicit;
  }
  if (process.platform === 'win32') {
    const located = await runCommand('where.exe', ['lark-cli'], { silent: true, timeoutMs: 5000 });
    if (located.code === 0) {
      const candidates = located.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      const candidate = candidates.find((value) => /\.(cmd|exe|ps1)$/i.test(value)) ?? candidates[0];
      if (candidate?.toLowerCase().endsWith('.ps1')) {
        return { command: 'powershell.exe', prefix: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', candidate] };
      }
      if (candidate) return { command: candidate, prefix: [] };
    }
  }
  // npm install -g may have completed while the current Git Bash/PATH is
  // stale. Resolve the launcher from npm's global prefix before reporting it
  // as missing; this also handles npm installations outside PATH.
  const npmGlobal = await resolveNpmGlobalLarkRunner();
  if (npmGlobal) return npmGlobal;
  return { command: commandName('lark-cli'), prefix: [] };
}

async function runnerFromPath(candidatePath) {
  const candidate = path.resolve(String(candidatePath));
  if (!await exists(candidate)) return undefined;
  const details = await stat(candidate);
  if (details.isFile()) {
    if (candidate.toLowerCase().endsWith('.ps1')) {
      return { command: 'powershell.exe', prefix: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', candidate], source: 'offline' };
    }
    return { command: candidate, prefix: [], source: 'offline' };
  }

  const launchers = process.platform === 'win32'
    ? ['lark-cli.cmd', 'lark-cli.exe', 'lark-cli.ps1', 'lark-cli']
    : ['lark-cli', 'lark-cli.sh'];
  for (const launcher of launchers) {
    const resolved = await runnerFromPath(path.join(candidate, launcher));
    if (resolved) return resolved;
  }

  const scriptCandidates = [
    path.join(candidate, 'scripts', 'run.js'),
    path.join(candidate, 'node_modules', '@larksuite', 'cli', 'scripts', 'run.js'),
  ];
  for (const script of scriptCandidates) {
    if (!await exists(script)) continue;
    const packageRoot = path.resolve(path.dirname(script), '..');
    const binary = path.join(packageRoot, 'bin', process.platform === 'win32' ? 'lark-cli.exe' : 'lark-cli');
    if (await exists(binary)) return { command: process.execPath, prefix: [script], source: 'offline' };
  }
  return undefined;
}

async function resolveNpmGlobalLarkRunner() {
  const prefixResult = await runCommand(commandName('npm'), ['prefix', '-g'], { silent: true, timeoutMs: 10000 });
  if (prefixResult.code !== 0) return undefined;
  const prefix = prefixResult.stdout.trim().split(/\r?\n/).filter(Boolean).pop();
  if (!prefix) return undefined;

  const roots = process.platform === 'win32'
    ? [prefix, path.join(prefix, 'node_modules', '@larksuite', 'cli')]
    : [path.join(prefix, 'bin'), prefix, path.join(prefix, 'lib', 'node_modules', '@larksuite', 'cli')];
  for (const root of [...new Set(roots)]) {
    const runner = await runnerFromPath(root);
    if (runner) return { ...runner, source: 'npm-global' };
  }
  return undefined;
}

async function resolveOfflineLarkRunner() {
  const configuredRoot = process.env.MIAODA_LARK_CLI_DIR || process.env.LARK_CLI_OFFLINE_DIR;
  const architecture = process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : process.arch;
  const platformDirectory = `${process.platform}-${architecture}`;
  const roots = [
    configuredRoot,
    path.join(scaffoldRoot, 'vendor', 'lark-cli', platformDirectory),
    path.join(scaffoldRoot, 'vendor', 'lark-cli'),
  ].filter(Boolean);
  for (const root of [...new Set(roots)]) {
    const runner = await runnerFromPath(root);
    if (runner) return runner;
  }
  return undefined;
}

function isRetryableLarkInstallFailure(text) {
  return /enotfound|eai_again|econnreset|etimedout|timeout|timed out|network|fetch|socket|proxy|超时|网络|连接|白名单/i.test(String(text ?? ''));
}

async function installLarkFromNetwork() {
  const attempts = 3;
  let lastText = '';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    printStep(`安装 lark-cli（npm 全局安装，网络尝试 ${attempt}/${attempts}）`);
    // 按公司安装规范使用 npm 全局安装。官方安装器仍可能下载平台对应的
    // 原生二进制；网络、代理和白名单限制无法由脚手架绕过。
    const result = await runCommand(commandName('npm'), ['install', '-g', '@larksuite/cli@latest'], { timeoutMs: 120000 });
    if (result.code === 0) return undefined;
    lastText = resultText(result);
    if (attempt === attempts || !isRetryableLarkInstallFailure(lastText)) break;
  }
  return lastText;
}

async function ensureNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isFinite(major) || major < REQUIRED_NODE_MAJOR) {
    throw new SyncError(
      '检查 Node.js',
      `当前 Node.js 版本为 ${process.version}，脚手架需要 Node.js ${REQUIRED_NODE_MAJOR} 或更高版本。`,
      '请先安装或升级 Node.js LTS，然后重新打开终端执行 npm run miaoda:init。'
    );
  }
  console.log(`✓ Node.js ${process.version}`);
}

async function findPackageInstaller() {
  const candidates = process.platform === 'win32'
    ? [
      { command: 'winget', versionArgs: ['--version'], installArgs: ['install', '--id', 'Git.Git', '--exact', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements'], label: 'winget' },
      { command: 'choco', versionArgs: ['--version'], installArgs: ['install', 'git', '-y'], label: 'Chocolatey' },
    ]
    : process.platform === 'darwin'
      ? [{ command: 'brew', versionArgs: ['--version'], installArgs: ['install', 'git'], label: 'Homebrew' }]
      : [
        { command: 'apt-get', versionArgs: ['--version'], installArgs: ['install', '-y', 'git'], label: 'apt' },
        { command: 'dnf', versionArgs: ['--version'], installArgs: ['install', '-y', 'git'], label: 'dnf' },
      ];

  for (const candidate of candidates) {
    const result = await runCommand(commandName(candidate.command), candidate.versionArgs, { silent: true });
    if (result.code === 0) return candidate;
  }
  return undefined;
}

async function ensureGit() {
  let result = await runCommand(commandName('git'), ['--version'], { silent: true });
  if (result.code === 0) {
    console.log(`✓ ${result.stdout.trim()}`);
    return;
  }

  if (!process.stdin.isTTY) {
    throw new SyncError('检查 Git', '未找到 Git。', '请先安装 Git，并重新打开终端使 PATH 生效。');
  }

  const installer = await findPackageInstaller();
  if (!installer) {
    throw new SyncError('检查 Git', '未找到 Git，也没有检测到可用的软件包管理器。', '请从 https://git-scm.com/downloads 安装 Git，并重新打开终端。');
  }

  const confirmed = await askYesNo(`未检测到 Git，是否使用 ${installer.label} 自动安装`);
  if (!confirmed) {
    throw new SyncError('检查 Git', '用户选择不安装 Git。', '安装 Git 后重新执行 npm run miaoda:init。');
  }

  printStep(`安装 Git（${installer.label}）`);
  const installed = await runCommand(commandName(installer.command), installer.installArgs);
  if (installed.code !== 0) {
    const text = resultText(installed);
    throw new SyncError('安装 Git', redactOutput(text), classifyFailure(text));
  }

  result = await runCommand(commandName('git'), ['--version'], { silent: true });
  if (result.code !== 0) {
    throw new SyncError('重新检查 Git', 'Git 安装命令已结束，但当前终端仍找不到 Git。', '请关闭并重新打开终端，让 Git 加入 PATH 后再重试。');
  }
  console.log(`✓ ${result.stdout.trim()}`);
}

async function ensureLark() {
  printStep('检查 lark-cli 可执行文件');
  let runner = await resolveLarkRunner();
  let check = await runCommand(runner.command, [...runner.prefix, '--help'], { silent: true, timeoutMs: 15000 });
  if (check.code === 0) {
    larkRunner = runner;
    return runner;
  }
  const systemCheckTimedOut = check.timedOut;

  const offline = await resolveOfflineLarkRunner();
  if (offline) {
    check = await runCommand(offline.command, [...offline.prefix, '--help'], { silent: true, timeoutMs: 15000 });
    if (check.code === 0) {
      console.log('✓ 使用脚手架内置/指定的离线 lark-cli');
      larkRunner = offline;
      return offline;
    }
    if (check.timedOut) {
      throw new SyncError('检查离线 lark-cli', '离线 lark-cli 执行 --help 超过 15 秒仍未返回。', '请检查离线包是否完整且与当前 Windows/CPU 匹配。');
    }
  }
  if (systemCheckTimedOut) {
    throw new SyncError('检查 lark-cli', '已找到系统 lark-cli，但执行 lark-cli --help 超过 15 秒仍未返回。', '请结束卡住的 lark-cli 进程并让 IT 检查 CLI 安装包或安全软件拦截；如果仓库内有匹配平台的离线包，脚手架会优先使用它。');
  }

  // @lark-project/meegle 安装的是 `meegle`，不是妙搭同步所需的 `lark-cli`。
  // 提前检测并给出明确提示，避免用户以为已经安装了“飞书 CLI”。
  const meegleCheck = await runCommand(commandName('meegle'), ['--help'], { silent: true, timeoutMs: 5000 });
  const cliPackageHint = meegleCheck.code === 0
    ? '当前检测到的是 meegle（@lark-project/meegle），它不能替代 lark-cli；妙搭同步需要通用包 @larksuite/cli。'
    : '妙搭同步需要通用 lark-cli（npm 包 @larksuite/cli），不是飞书项目的 meegle。';

  if (!process.stdin.isTTY) {
    throw new SyncError('检查 lark-cli', `未找到可执行的 lark-cli，且没有可用的离线备用包。${cliPackageHint}`, '请执行 npm install -g @larksuite/cli，或设置 MIAODA_LARK_CLI_PATH/LARK_CLI_OFFLINE_DIR 指向已准备好的离线包。');
  }
  const install = await askYesNo(`未检测到 lark-cli。${cliPackageHint}是否使用官方 npm 包安装`);
  if (!install) {
    throw new SyncError('检查 lark-cli', '用户选择不安装 lark-cli。', '安装后重新执行 npm run miaoda:init。');
  }
  const networkError = await installLarkFromNetwork();
  if (networkError) {
    const fallback = await resolveOfflineLarkRunner();
    if (fallback) {
      const fallbackCheck = await runCommand(fallback.command, [...fallback.prefix, '--help'], { silent: true, timeoutMs: 15000 });
      if (fallbackCheck.code === 0) {
        console.warn('网络安装 lark-cli 失败，已切换到离线备用包。');
        larkRunner = fallback;
        return fallback;
      }
    }
    console.error('说明：安装器显示的 config/auth 命令只是安装成功后的下一步；本次 lark-cli 二进制下载失败，脚手架不会执行这两个命令。');
    throw new SyncError('安装 lark-cli', redactOutput(networkError), `${classifyFailure(networkError)} 请确认企业网络允许访问 npm 及 CLI 下载地址；如内网无法访问 npm，请准备完整的离线 lark-cli 包并设置 LARK_CLI_OFFLINE_DIR。`);
  }
  runner = await resolveLarkRunner();
  check = await runCommand(runner.command, [...runner.prefix, '--help'], { silent: true, timeoutMs: 15000 });
  if (check.code !== 0) {
    if (check.timedOut) {
      throw new SyncError('检查 lark-cli', '安装后已找到 lark-cli，但执行 --help 超过 15 秒仍未返回。', '请重新打开终端后执行 lark-cli --help；如果同样卡住，请让 IT 检查 CLI 安装包或安全软件拦截。');
    }
    const fallback = await resolveOfflineLarkRunner();
    if (fallback) {
      const fallbackCheck = await runCommand(fallback.command, [...fallback.prefix, '--help'], { silent: true, timeoutMs: 15000 });
      if (fallbackCheck.code === 0) {
        console.warn('网络安装完成但 PATH 未刷新，已切换到离线备用包。');
        larkRunner = fallback;
        return fallback;
      }
    }
    throw new SyncError('检查 lark-cli', '安装完成后仍未找到可执行的 lark-cli。', '请重新打开终端，确认 npm 全局 bin 目录已经加入 PATH，或设置 LARK_CLI_OFFLINE_DIR。');
  }
  larkRunner = runner;
  return runner;
}

async function runLark(args, options = {}) {
  const runner = larkRunner ?? await ensureLark();
  return runCommand(runner.command, [...runner.prefix, ...args], options);
}

function resultText(result) {
  return `${result.stderr ?? ''}\n${result.stdout ?? ''}\n${result.error?.message ?? ''}`.trim();
}

function resultEnvelope(result) {
  try { return parseJsonEnvelope(result.stdout); } catch { return undefined; }
}

function resultFailed(result) {
  return result.code !== 0 || resultEnvelope(result)?.ok === false;
}

function requiresMiaodaUserAuthorization(result) {
  return /need_user_authorization|token_missing|missing_scope|user.?authorization|未登录|未授权/i.test(resultText(result));
}

async function authorizeMiaodaUser() {
  printStep('补充妙搭用户授权（需要浏览器授权）');
  const loggedIn = await runLark(['auth', 'login', '--domain', 'apps'], { interactive: true });
  if (loggedIn.code !== 0 || resultEnvelope(loggedIn)?.ok === false) {
    const text = resultText(loggedIn);
    throw new SyncError('补充妙搭用户授权', redactOutput(text), classifyFailure(text));
  }
}

async function runMiaodaUserCommand(args, options = {}) {
  let result = await runLark(args, options);
  if (resultFailed(result) && requiresMiaodaUserAuthorization(result)) {
    await authorizeMiaodaUser();
    result = await runLark(args, options);
  }
  return result;
}

async function ensureLarkAuth() {
  printStep('检查飞书 CLI 配置');
  let config = await runLark(['config', 'show'], { silent: true });
  let configJson;
  try { configJson = parseJsonEnvelope(config.stdout); } catch { configJson = undefined; }
  if (config.code !== 0 || configJson?.ok === false) {
    const message = resultText(config);
    if (!/not_configured|not configured|未配置/i.test(message) && config.code !== 0) {
      throw new SyncError('检查飞书 CLI 配置', redactOutput(message), classifyFailure(message));
    }
    printStep('首次配置飞书 CLI（需要浏览器授权）');
    const initialized = await runLark(['config', 'init', '--new'], { interactive: true });
    if (initialized.code !== 0) {
      const text = resultText(initialized);
      throw new SyncError('首次配置飞书 CLI', redactOutput(text), classifyFailure(text));
    }
  }

  printStep('检查飞书用户授权');
  let auth = await runLark(['auth', 'status'], { silent: true });
  let authJson;
  try { authJson = parseJsonEnvelope(auth.stdout); } catch { authJson = undefined; }
  if (auth.code !== 0 || authJson?.ok === false || /not logged|未登录|unauthorized|未授权/i.test(resultText(auth))) {
    printStep('首次登录飞书账号（需要浏览器授权）');
    const loggedIn = await runLark(['auth', 'login', '--recommend'], { interactive: true });
    if (loggedIn.code !== 0) {
      const text = resultText(loggedIn);
      throw new SyncError('登录飞书账号', redactOutput(text), classifyFailure(text));
    }
    auth = await runLark(['auth', 'status'], { silent: true });
    if (auth.code !== 0) {
      const text = resultText(auth);
      throw new SyncError('验证飞书账号', redactOutput(text), classifyFailure(text));
    }
  }
}

async function getMiaodaRepository(appId) {
  printStep(`核对妙搭应用 ${appId}`);
  const app = await runMiaodaUserCommand(['apps', '+get', '--app-id', appId, '--as', 'user'], { silent: true });
  if (resultFailed(app)) {
    const text = resultText(app);
    throw new SyncError('核对妙搭应用', redactOutput(text), classifyFailure(text));
  }

  printStep('初始化妙搭 Git 凭证');
  const credential = await runMiaodaUserCommand(['apps', '+git-credential-init', '--app-id', appId, '--as', 'user']);
  if (resultFailed(credential)) {
    const text = resultText(credential);
    throw new SyncError('初始化妙搭 Git 凭证', redactOutput(text), classifyFailure(text));
  }
  const repositoryUrl = extractRepositoryUrl(resultText(credential));
  if (!repositoryUrl) {
    throw new SyncError('读取妙搭 Git 地址', 'CLI 返回成功，但没有找到 repository_url。', '请保存 CLI 原始输出并检查 lark-cli 版本。');
  }
  return repositoryUrl;
}

async function git(args, options = {}) {
  return runCommand(commandName('git'), args, options);
}

async function gitChecked(args, step, options = {}) {
  const result = await git(args, options);
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError(step, redactOutput(text), classifyFailure(text));
  }
  return result;
}

async function ensureBranchExists(repositoryUrl, branch) {
  const result = await git(['ls-remote', '--exit-code', '--heads', repositoryUrl, `refs/heads/${branch}`], { silent: true });
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError('检查妙搭开发分支', redactOutput(text || `远端不存在 ${branch}`), classifyFailure(`${text} branch`));
  }
}

async function ensureGitExclude(projectRoot) {
  const excludePath = path.join(projectRoot, '.git', 'info', 'exclude');
  if (!await exists(path.dirname(excludePath))) await mkdir(path.dirname(excludePath), { recursive: true });
  const current = await exists(excludePath) ? await readFile(excludePath, 'utf8') : '';
  if (!current.split(/\r?\n/).includes(SYNC_CONFIG_FILE)) {
    const next = `${current.trimEnd()}${current.trim() ? '\n' : ''}${SYNC_CONFIG_FILE}\n`;
    await writeFile(excludePath, next, 'utf8');
  }
}

async function readGitStatus(projectRoot) {
  const result = await git(['-C', projectRoot, 'status', '--short'], { silent: true });
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError('读取 Git 状态', redactOutput(text), classifyFailure(text));
  }
  return result.stdout.trim();
}

async function cloneOrUpdate(repositoryUrl, projectRoot, branch) {
  const targetExists = await exists(projectRoot);
  if (!targetExists) {
    await mkdir(path.dirname(projectRoot), { recursive: true });
    await gitChecked(['clone', '--branch', branch, '--single-branch', repositoryUrl, projectRoot], '拉取妙搭项目代码');
    return { cloned: true, updated: true };
  }

  const targetStat = await stat(projectRoot);
  if (!targetStat.isDirectory()) {
    throw new SyncError('检查目标目录', `${projectRoot} 不是目录。`, '请选择一个新的本地项目目录。');
  }
  const entries = await readdir(projectRoot);
  if (!entries.length) {
    await gitChecked(['clone', '--branch', branch, '--single-branch', repositoryUrl, projectRoot], '拉取妙搭项目代码');
    return { cloned: true, updated: true };
  }

  if (!await exists(path.join(projectRoot, '.git'))) {
    throw new SyncError('检查目标目录', `目标目录非空且不是 Git 仓库：${projectRoot}`, '脚手架不会覆盖已有目录，请换一个目录或人工确认。');
  }
  const remote = await gitChecked(['-C', projectRoot, 'config', '--get', 'remote.origin.url'], '读取本地 Git 远端');
  if (normalizeRemote(remote.stdout) !== normalizeRemote(repositoryUrl)) {
    throw new SyncError('核对 Git 远端', '目标目录的 origin 不是当前妙搭应用远端。', '请使用新的目录，或先人工核对远端，不会自动替换 origin。');
  }
  const status = await readGitStatus(projectRoot);
  if (status) {
    throw new SyncError('检查本地改动', `目标目录存在未提交改动：\n${status}`, '请先保存或提交改动后重试，脚手架不会自动覆盖。');
  }
  const currentBranch = (await gitChecked(['-C', projectRoot, 'branch', '--show-current'], '读取当前分支')).stdout.trim();
  if (currentBranch !== branch) {
    throw new SyncError('核对当前分支', `当前分支是 ${currentBranch || '（游离 HEAD）'}，目标分支是 ${branch}。`, '请人工切换到目标开发分支后重试。');
  }
  await gitChecked(['-C', projectRoot, 'fetch', 'origin', branch], '拉取妙搭远端更新');
  const relation = parseAheadBehind((await gitChecked(['-C', projectRoot, 'rev-list', '--left-right', '--count', `HEAD...origin/${branch}`], '比较本地和远端提交')).stdout);
  if (relation.ahead > 0 && relation.behind > 0) {
    throw new SyncError('整合妙搭远端更新', '本地和远端提交已经分叉。', '请先人工整合，脚手架不会自动 rebase、stash 或强推。');
  }
  if (relation.behind > 0) await gitChecked(['-C', projectRoot, 'merge', '--ff-only', `origin/${branch}`], '快进到妙搭最新提交');
  return { cloned: false, updated: relation.behind > 0 };
}

async function saveConfig(projectRoot, config) {
  await writeFile(path.join(projectRoot, SYNC_CONFIG_FILE), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  await ensureGitExclude(projectRoot);
}

async function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot, SYNC_CONFIG_FILE);
  if (!await exists(configPath)) {
    throw new SyncError('读取妙搭同步配置', `未找到 ${configPath}`, '请先执行 npm run miaoda:init，或在正确的妙搭项目根目录执行命令。');
  }
  try {
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    return {
      appId: parseAppId(config.appId),
      remote: String(config.remote || 'origin'),
      branch: String(config.branch || DEFAULT_BRANCH),
    };
  } catch (error) {
    throw new SyncError('读取妙搭同步配置', `配置文件格式错误：${error.message}`, '请删除本地配置后重新执行 npm run miaoda:init。');
  }
}

async function resolveProjectRoot(options, { allowPrompt = true } = {}) {
  if (options.target) return path.resolve(String(options.target));
  if (await exists(path.join(defaultProjectRoot, SYNC_CONFIG_FILE))) return defaultProjectRoot;
  if (await exists(path.join(process.cwd(), SYNC_CONFIG_FILE))) return path.resolve(process.cwd());
  if (!allowPrompt) return defaultProjectRoot;
  const answer = await ask('请输入已克隆的妙搭项目目录', defaultProjectRoot);
  return path.resolve(answer);
}

async function runProjectInit(projectRoot) {
  const script = path.join(projectRoot, 'design-system', 'scripts', 'project-init.mjs');
  if (!await exists(script)) {
    throw new SyncError('刷新设计系统审计', '项目中没有 design-system/scripts/project-init.mjs。', '请先完成妙搭初始化，或在该项目执行一次 project:init。');
  }
  const result = await runCommand(process.execPath, [script], { cwd: projectRoot });
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError('刷新设计系统审计', redactOutput(text), classifyFailure(text));
  }
}

async function installScaffold(projectRoot) {
  const installer = path.join(scaffoldRoot, 'scripts', 'install-project.mjs');
  if (!await exists(installer)) throw new SyncError('安装设计系统脚手架', '找不到脚手架安装器。', '请从 design-token-scaffold 项目根目录执行本命令。');
  const result = await runCommand(process.execPath, [installer, '--target', projectRoot, '--miaoda'], { cwd: scaffoldRoot });
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError('安装设计系统脚手架', redactOutput(text), classifyFailure(text));
  }
}

async function init(options) {
  await ensureNode();
  await ensureGit();
  await ensureLark();

  const appInput = options['app-id'] ?? await ask('请输入妙搭应用链接或 app_id');
  let appId;
  try {
    appId = parseAppId(appInput);
  } catch (error) {
    throw new SyncError('读取妙搭应用 ID', error.message, '请输入 app_ 开头的应用 ID，或完整的妙搭应用链接。');
  }
  const defaultTarget = path.resolve(process.cwd(), 'MIAODA-APP');
  const targetInput = options.target ?? await ask('请输入本地项目目录', defaultTarget);
  const projectRoot = path.resolve(String(targetInput));
  const branch = String(options.branch ?? DEFAULT_BRANCH);

  await ensureLarkAuth();
  const repositoryUrl = await getMiaodaRepository(appId);

  printStep(`检查妙搭分支 ${branch}`);
  await ensureBranchExists(repositoryUrl, branch);
  printStep(`同步妙搭源码到 ${projectRoot}`);
  const cloneResult = await cloneOrUpdate(repositoryUrl, projectRoot, branch);
  await saveConfig(projectRoot, { version: 1, appId, remote: 'origin', branch });

  printStep('安装脚手架并执行首次确定性扫描');
  await installScaffold(projectRoot);

  console.log('\n妙搭项目初始化完成。');
  console.log(`应用：${appId}`);
  console.log(`本地目录：${projectRoot}`);
  console.log(`开发分支：${branch}`);
  console.log(`代码动作：${cloneResult.cloned ? '已 clone' : cloneResult.updated ? '已快进更新' : '已复用现有克隆'}`);
  console.log('已完成：脚手架安装、Token/审计扫描和构建。没有自动提交或推送。');
  console.log('后续在该目录执行 npm run miaoda:pull 或 npm run miaoda:push。');
}

async function pull(options) {
  const projectRoot = await resolveProjectRoot(options);
  const config = await loadConfig(projectRoot);
  const status = await readGitStatus(projectRoot);
  if (status) throw new SyncError('检查本地改动', `工作区存在未提交改动：\n${status}`, '请先处理 git diff，再执行 miaoda:pull。');

  printStep(`拉取 ${config.remote}/${config.branch}`);
  await gitChecked(['-C', projectRoot, 'fetch', config.remote, config.branch], '拉取妙搭远端更新');
  const relation = parseAheadBehind((await gitChecked(['-C', projectRoot, 'rev-list', '--left-right', '--count', `HEAD...${config.remote}/${config.branch}`], '比较本地和远端提交')).stdout);
  if (relation.ahead > 0 && relation.behind > 0) {
    throw new SyncError('整合妙搭远端更新', '本地和远端提交已经分叉。', '请先人工整合，未执行覆盖操作。');
  }
  if (relation.behind === 0) {
    console.log(relation.ahead ? `本地领先远端 ${relation.ahead} 个提交，未执行拉取。` : '本地已经是妙搭远端最新提交。');
    return;
  }
  await gitChecked(['-C', projectRoot, 'merge', '--ff-only', `${config.remote}/${config.branch}`], '快进到妙搭最新提交');
  printStep('源码发生变化，刷新设计系统审计');
  await runProjectInit(projectRoot);
  console.log(`妙搭代码已更新，新增 ${relation.behind} 个提交；Token/审计已刷新。`);
}

async function runDesignSystemCheck(projectRoot, stagedPaths) {
  if (!stagedPaths.some((value) => {
    const normalized = value.replaceAll('\\', '/');
    return normalized === 'design-system' || normalized.startsWith('design-system/');
  })) return;
  const packagePath = path.join(projectRoot, 'design-system', 'package.json');
  if (!await exists(packagePath)) return;
  printStep('校验设计系统 Token 产物');
  const result = await runCommand(commandName('npm'), ['--prefix', 'design-system', 'run', 'check'], { cwd: projectRoot });
  if (result.code !== 0) {
    const text = resultText(result);
    throw new SyncError('校验设计系统 Token 产物', redactOutput(text), '请先修复 npm --prefix design-system run check 的错误，不会继续提交。');
  }
}

async function push(options) {
  const projectRoot = await resolveProjectRoot(options);
  const config = await loadConfig(projectRoot);
  const currentBranch = (await gitChecked(['-C', projectRoot, 'branch', '--show-current'], '读取当前分支')).stdout.trim();
  if (currentBranch !== config.branch) {
    throw new SyncError('核对推送分支', `当前分支是 ${currentBranch || '（游离 HEAD）'}，配置分支是 ${config.branch}。`, '不会自动切换或推送到其他分支。');
  }

  const beforeStatus = await readGitStatus(projectRoot);
  const requestedPaths = options.paths ? validateSyncPaths(options.paths) : [];
  if (requestedPaths.length) {
    await runDesignSystemCheck(projectRoot, requestedPaths);
    // 先校验并生成可能变化的 dist，再暂存，避免构建产物落在提交之外。
    const stagePaths = [...requestedPaths];
    const touchesDesignSystem = requestedPaths.some((value) => {
      const normalized = value.replaceAll('\\', '/');
      return normalized === 'design-system' || normalized.startsWith('design-system/');
    });
    if (touchesDesignSystem && !stagePaths.includes('design-system')) stagePaths.push('design-system/dist');
    await gitChecked(['-C', projectRoot, 'add', '--', ...stagePaths], '暂存指定文件');
    const check = await git(['-C', projectRoot, 'diff', '--cached', '--check'], { silent: true });
    if (check.code !== 0) {
      const text = resultText(check);
      throw new SyncError('检查暂存内容', redactOutput(text), '请修复空白字符或冲突标记后重试。');
    }
    const stagedStat = await gitChecked(['-C', projectRoot, 'diff', '--cached', '--stat'], '读取暂存内容');
    if (!stagedStat.stdout.trim()) {
      console.log('指定路径没有新的暂存改动，不执行提交。');
    } else {
      console.log(`\n本次准备提交：\n${stagedStat.stdout.trim()}`);
      const confirmed = options.yes === true || await askYesNo('是否提交并推送以上文件');
      if (!confirmed) throw new SyncError('提交本地改动', '用户取消提交和推送。', '暂存内容已保留，没有推送。');
      const message = String(options.message ?? 'chore: 同步妙搭项目代码');
      await gitChecked(['-C', projectRoot, 'commit', '-m', message], '提交本地改动');
    }
  } else if (beforeStatus) {
    throw new SyncError('检查待推送内容', `工作区存在未提交改动：\n${beforeStatus}`, '为避免误提交，请使用 --paths 指定本次同步路径。');
  }

  printStep(`检查 ${config.remote}/${config.branch} 的最新状态`);
  await gitChecked(['-C', projectRoot, 'fetch', config.remote, config.branch], '读取妙搭远端状态');
  const relation = parseAheadBehind((await gitChecked(['-C', projectRoot, 'rev-list', '--left-right', '--count', `HEAD...${config.remote}/${config.branch}`], '比较待推送提交')).stdout);
  if (relation.behind > 0) {
    throw new SyncError('推送前整合远端更新', `妙搭远端领先 ${relation.behind} 个提交。`, '请先执行 npm run miaoda:pull，确认后再推送。');
  }
  if (relation.ahead === 0) {
    console.log('没有待推送提交，妙搭远端已经同步。');
    return;
  }
  const localSha = (await gitChecked(['-C', projectRoot, 'rev-parse', 'HEAD'], '读取本地提交')).stdout.trim();
  printStep(`推送 ${relation.ahead} 个提交到妙搭`);
  await gitChecked(['-C', projectRoot, 'push', config.remote, `HEAD:${config.branch}`], '推送妙搭开发分支');
  const remoteSha = (await gitChecked(['ls-remote', config.remote, `refs/heads/${config.branch}`], '核对妙搭远端提交')).stdout.trim().split(/\s+/)[0];
  if (remoteSha !== localSha) {
    throw new SyncError('核对推送结果', `本地提交 ${localSha} 与远端提交 ${remoteSha} 不一致。`, '推送结果未确认，请先只读检查远端，不要重复强推。');
  }
  console.log(`推送完成：${localSha}`);
}

function printHelp() {
  console.log(`妙搭代码同步命令：

  npm run miaoda:init
    首次配置授权、拉取妙搭 sprint/default、安装脚手架并执行扫描。
  npm run miaoda:pull
    拉取已提交的妙搭代码；源码变化后自动刷新 Token/审计。
  npm run miaoda:push -- --paths design-system client/src/pages/你的页面
    只提交并推送明确指定的文件。推送前会检查工作区和远端分支。

首次运行可用参数：
  --app-id <app_id 或妙搭链接> --target <本地目录>

推送参数：
  --paths <路径...>   必填（存在未提交改动时）
  --message <提交说明>
  --yes               跳过提交确认，仅适用于已明确授权的自动化环境
`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (options.help || command === 'help' || command === '--help') {
    printHelp();
    return;
  }
  if (!['init', 'pull', 'push'].includes(command)) {
    throw new SyncError('读取命令', `不支持的妙搭同步命令：${command}`, '可用命令：init、pull、push。');
  }
  if (command === 'init') await init(options);
  if (command === 'pull') await pull(options);
  if (command === 'push') await push(options);
}

try {
  await main();
} catch (error) {
  if (error instanceof SyncError) {
    console.error(`\n✖ ${error.step}失败：${error.message}`);
    if (error.hint) console.error(`建议：${error.hint}`);
  } else {
    console.error(`\n✖ 妙搭同步失败：${redactOutput(error?.message ?? error)}`);
    console.error(`建议：${classifyFailure(error?.message ?? error)}`);
    if (process.argv.includes('--debug')) console.error(error?.stack ?? error);
  }
  process.exitCode = 1;
} finally {
  await closePrompt();
}

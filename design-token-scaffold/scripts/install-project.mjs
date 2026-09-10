import { access, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scaffoldRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv.slice(2);
const args = {};
for (let index = 0; index < input.length; index += 1) {
  if (!input[index].startsWith('--')) continue;
  const name = input[index].slice(2);
  args[name] = input[index + 1]?.startsWith('--') ? true : (input[++index] ?? true);
}

// `--target` 只用于首次从脚手架目录安装到外部项目；安装完成后，
// 若目标项目已声明同名脚本，即可在项目根目录无参数执行刷新。
const targetRoot = path.resolve(String(args.target ?? process.cwd()));
if (!args.target && targetRoot === scaffoldRoot) {
  console.error('请在目标项目根目录执行 npm run project:init，或首次安装时传入 --target <项目目录>。');
  process.exit(2);
}
const agent = String(args.agent ?? 'both').toLowerCase();
const force = args.force === true || args.force === 'true';
const skipExtract = args['skip-extract'] === true || args['skip-extract'] === 'true';
if (!['codex', 'claude', 'both'].includes(agent)) {
  console.error('--agent 只支持 codex、claude 或 both。');
  process.exit(2);
}
await access(targetRoot);

const copied = [];
const skipped = [];

async function exists(target) {
  try { await access(target); return true; } catch { return false; }
}

function runNodeScript(script, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...scriptArgs], {
      cwd: targetRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${stderr || stdout || '脚本执行失败'}（退出码 ${code}）`));
    });
  });
}

async function copyTree(source, destination) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'examples' || entry.name === 'skills' || entry.name === 'install-project.mjs') continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyTree(from, to);
    if (entry.isFile()) {
      if (!force && await exists(to)) { skipped.push(to); continue; }
      await mkdir(path.dirname(to), { recursive: true });
      await copyFile(from, to);
      copied.push(to);
    }
  }
}

const designSystemRoot = path.join(targetRoot, 'design-system');
for (const name of ['tokens.config.json', '.gitignore']) {
  const destination = path.join(designSystemRoot, name);
  if (!force && await exists(destination)) skipped.push(destination);
  else {
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(path.join(scaffoldRoot, name), destination);
    copied.push(destination);
  }
}
const packageTarget = path.join(designSystemRoot, 'package.json');
if (!force && await exists(packageTarget)) skipped.push(packageTarget);
else {
  const packageDocument = JSON.parse(await readFile(path.join(scaffoldRoot, 'package.json'), 'utf8'));
  delete packageDocument.scripts['project:init'];
  packageDocument.name = `${path.basename(targetRoot).toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'project'}-design-system`;
  await mkdir(path.dirname(packageTarget), { recursive: true });
  await writeFile(packageTarget, `${JSON.stringify(packageDocument, null, 2)}\n`, 'utf8');
  copied.push(packageTarget);
}
for (const directory of ['schema', 'scripts', 'src', 'tests', 'docs', 'miaoda']) {
  await copyTree(path.join(scaffoldRoot, directory), path.join(designSystemRoot, directory));
}
for (const skill of ['extract-design-tokens', 'apply-design-tokens']) {
  await copyTree(
    path.join(scaffoldRoot, 'skills', skill),
    path.join(targetRoot, '.agents', 'skills', skill)
  );
}

// 注册唯一的项目级刷新入口。只在缺少脚本时写入，不覆盖项目已有命令；
// 这样初始化后即可在目标项目根目录直接执行 `npm run project:init`。
let projectScriptRegistered = false;
const projectPackagePath = path.join(targetRoot, 'package.json');
if (await exists(projectPackagePath)) {
  try {
    const projectPackage = JSON.parse(await readFile(projectPackagePath, 'utf8'));
    projectPackage.scripts ??= {};
    const projectInitCommand = 'node design-system/scripts/project-init.mjs';
    if (!projectPackage.scripts['project:init']) {
      projectPackage.scripts['project:init'] = projectInitCommand;
      await writeFile(projectPackagePath, `${JSON.stringify(projectPackage, null, 2)}\n`, 'utf8');
      copied.push(projectPackagePath);
      projectScriptRegistered = true;
    } else if (projectPackage.scripts['project:init'] !== projectInitCommand) {
      console.warn('目标项目已有 project:init 脚本，未覆盖；如需使用设计系统刷新命令，请手动将其指向 design-system/scripts/project-init.mjs。');
    }
  } catch (error) {
    console.warn(`未能更新目标项目 package.json：${error.message}`);
  }
}

// Claude Code 的项目级命令属于目标项目配置，不放进 design-system 运行时包。
// 默认保留用户已有命令；只有 --force 才覆盖同名文件。
if (agent === 'claude' || agent === 'both') {
  const commandRoot = path.join(targetRoot, '.claude', 'commands');
  for (const command of ['build-page.md', '页面开发.md', 'extract-design-system.md']) {
    const destination = path.join(commandRoot, command);
    if (!force && await exists(destination)) skipped.push(destination);
    else {
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(path.join(scaffoldRoot, 'commands', command), destination);
      copied.push(destination);
    }
  }
}

const ruleBlock = `<!-- design-token-system:start -->
## Design Token 系统

- 涉及页面、主题、样式或组件视觉实现时，必须先读取并使用 \`$apply-design-tokens\`：\`.agents/skills/apply-design-tokens/SKILL.md\`。
- 盘点现有样式、抽取硬编码值、建立或迁移设计规范时，必须读取并使用 \`$extract-design-tokens\`：\`.agents/skills/extract-design-tokens/SKILL.md\`。
- \`design-system/src/tokens\` 是设计决策的唯一事实来源；\`design-system/dist\` 是生成产物，不得手工修改。
- 业务组件优先使用语义 Token 或组件 Token。除数据可视化、算法计算和明确记录的例外外，不得新增硬编码颜色、字号、间距、圆角、阴影或动效值。
- 修改 Token 后必须运行 \`npm --prefix design-system run check\`，并根据影响检查亮色、暗色、键盘焦点、禁用态和响应式行为。
- 组件状态至少考虑 default、hover、pressed、focus-visible、disabled、loading、error 和 readonly；不适用的状态应在组件规范中说明。
- 新增组件视觉决策时，同步维护组件 Token、组件 Recipe 和迁移映射；不要让业务页面直接依赖 Primitive 色阶。
- 新增页面前阅读 design-system/docs/page-template-contract.md 及项目模板登记表。已有 AppShell/Layout 时复用内容插槽，只新增内容页及必要路由、菜单、权限、面包屑配置，禁止复制顶栏、侧栏、全局搜索或重复挂载壳层。
- 抽取覆盖实际主题、布局、组件状态、资源和代表页面，不以用户举例为上限；交付可编译模板代码、来源、插槽与验证状态，不能只生成 Markdown。
- 初始化或刷新项目审计可直接在项目根目录运行 \`npm run project:init\`。
- 妙搭首次接入必须先确认项目根目录的 \`AGENTS.md\` 或 \`CLAUDE.md\`（步骤 1），再把 \`design-system/miaoda/extensions/slash-page-development.md\` 原样注册为 \`/页面开发\`，然后调用固定的 \`@设计变量解析\` 生成/刷新步骤 2–5，最后才能执行页面开发。
- \`@设计变量解析\` 负责事实扫描、语义沉淀和模板登记；步骤 5 是登记现有壳层/插槽/页面模式，不是复制完整业务页面。没有真实 \`npm run project:init\` 返回码和产物更新时间，不得声称完成确定性扫描。
- Claude Code 可使用项目命令 \`/build-page\` 生成页面；自然语言页面需求同样适用。
- Claude Code 也可使用中文命令 \`/页面开发\`；妙搭中对应的技能定义位于 \`design-system/miaoda/extensions/slash-page-development.md\`。
- 妙搭的 \`@设计变量解析\` 定义位于 \`design-system/miaoda/extensions/at-design-variable-parser.md\`；若当前租户未开放自定义 @ 插件，可用 \`@文件解析\` 附加该文件执行同一流程。
- 两个扩展及其回退方式登记在 \`design-system/miaoda/manifest.json\`，导入妙搭后可按清单创建。
- 妙搭只能作为固定定义的安装器，创建技能时使用 \`design-system/miaoda/install-skill-prompt.md\`，不得让 Agent 自行生成或改写规则。
- 所有设计规范、Token 描述、审计报告、迁移说明和模型输出均使用中文；Token 键名、代码标识符和标准技术术语可以保留英文。
<!-- design-token-system:end -->`;

async function upsertRules(filename) {
  const target = path.join(targetRoot, filename);
  const current = await exists(target) ? await readFile(target, 'utf8') : '';
  const pattern = /<!-- design-token-system:start -->[\s\S]*?<!-- design-token-system:end -->/;
  const next = pattern.test(current)
    ? current.replace(pattern, ruleBlock)
    : `${current.trimEnd()}${current.trim() ? '\n\n' : ''}${ruleBlock}\n`;
  await writeFile(target, next, 'utf8');
  copied.push(target);
}

if (agent === 'codex' || agent === 'both') await upsertRules('AGENTS.md');
if (agent === 'claude' || agent === 'both') await upsertRules('CLAUDE.md');

const projectGuide = `# 项目 Design Token 使用说明

本目录保存项目的设计决策和构建工具。

- 编辑源文件：\`src/tokens/\`
- 校验并构建：\`npm run check\`
- 构建产物：\`dist/\`
- 首次抽取结果：\`audit/\`（由脚手架初始化命令自动生成）
- 页面模板登记：\`audit/page-templates.json\`（由源码证据登记；缺失项必须标记状态，不得凭经验补齐）
- 页面和组件实现：遵循 \`$apply-design-tokens\`，优先复用 \`audit/\` 中登记的壳层和模板
- 初始化后可直接在项目根目录运行 \`npm run project:init\` 刷新审计，脚手架会登记这一条固定脚本。

首次从脚手架安装时，执行 \`npm run project:init -- --target <项目目录>\` 会一次完成安装、规则写入和首次抽取；之后在目标项目根目录执行无参数命令即可刷新审计。接入妙搭时，先确认步骤 1 的项目规则，再原样注册 \`/页面开发\`，随后调用 \`@设计变量解析\` 生成/刷新步骤 2–5，最后执行页面开发。
首次进入项目后重新启动 Codex，使其重新加载 \`AGENTS.md\` 和仓库级 Skills。Claude 应从 \`CLAUDE.md\` 中读取相同规则。
`;
const guidePath = path.join(designSystemRoot, '项目使用说明.md');
if (force || !await exists(guidePath)) {
  await writeFile(guidePath, projectGuide, 'utf8');
  copied.push(guidePath);
} else skipped.push(guidePath);

if (!skipExtract) {
  const auditRoot = path.join(designSystemRoot, 'audit');
  const extractor = path.join(scaffoldRoot, 'skills', 'extract-design-tokens', 'scripts', 'extract-tokens.mjs');
  const excluded = ['design-system', '.agents', ...(String(args.exclude ?? '').split(',').map((value) => value.trim()).filter(Boolean))];
  const result = await runNodeScript(extractor, [
    '--root', targetRoot,
    '--output', auditRoot,
    '--exclude', [...new Set(excluded)].join(','),
  ]);
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.warn(result.stderr.trim());

  const builder = path.join(designSystemRoot, 'scripts', 'build.mjs');
  if (await exists(builder)) {
    const buildResult = await runNodeScript(builder, []);
    if (buildResult.stdout.trim()) console.log(buildResult.stdout.trim());
    if (buildResult.stderr.trim()) console.warn(buildResult.stderr.trim());
  }
}

console.log(`项目初始化完成：写入 ${copied.length} 个文件，保留 ${skipped.length} 个已有文件。`);
console.log(`目标目录：${targetRoot}`);
console.log(`抽取审计：${skipExtract ? '已跳过（可重新运行并移除 --skip-extract）' : path.join(designSystemRoot, 'audit')}`);
if (!skipExtract) console.log(`Token 产物：${path.join(designSystemRoot, 'dist')}`);
console.log(projectScriptRegistered
  ? '项目命令已登记：npm run project:init（以后在项目根目录直接执行即可）。'
  : '项目命令：npm run project:init（目标项目已有该脚本，或请检查其指向）。');
console.log('下一步：重新启动模型会话，然后直接用自然语言描述要创建的页面；模型会读取 design-system/audit、Token 和页面模板规则。');

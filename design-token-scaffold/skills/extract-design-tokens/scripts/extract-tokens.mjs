#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, item, index, all) => {
  if (item.startsWith('--')) pairs.push([item.slice(2), all[index + 1]]);
  return pairs;
}, []));

if (!args.root || !args.output) {
  console.error('用法：node extract-tokens.mjs --root <项目目录> --output <审计目录> [--exclude 目录1,目录2]');
  process.exit(2);
}

const projectRoot = path.resolve(args.root);
const outputRoot = path.resolve(args.output);
const ignored = new Set(['.extract-out', '.git', '.next', '.nuxt', '.output', 'build', 'coverage', 'dist', 'node_modules', 'vendor']);
for (const name of (args.exclude ?? '').split(',').map((value) => value.trim()).filter(Boolean)) ignored.add(name);
const extensions = new Set(['.css', '.scss', '.sass', '.less', '.styl', '.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte', '.html', '.json']);
const ignoredFiles = new Set(['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml']);
const detectors = [
  ['css-variable', /--[a-zA-Z0-9_-]+\s*:\s*([^;}{]+)/g],
  ['color', /#[0-9a-fA-F]{3,8}\b|(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([^)]*\)/g],
  ['dimension', /(?<![\w.-])-?(?:\d*\.\d+|\d+)(?:px|rem|em|vh|vw|vmin|vmax|ch|ex)\b/g],
  ['duration', /(?:transitionDuration|animationDuration|transition-duration|animation-duration|duration)\s*[:=]\s*["']?((?:\d*\.\d+|\d+)(?:ms|s))\b/g],
  ['font-weight', /(?:font-weight\s*:\s*|fontWeight\s*:\s*["']?)([1-9]00|normal|bold)\b/g],
  ['shadow', /(?:box-shadow\s*:\s*|boxShadow\s*:\s*["'])([^;"'}`]+)/g],
  ['font-family', /(?:font-family\s*:\s*|fontFamily\s*:\s*["'])([^;"'}`]+)/g]
];
const structureDetectors = [
  ['标题语义', /<h([1-6])\b|Typography[^>\n]*variant\s*=\s*["'](h[1-6])["']/g],
  ['表格结构', /<(TableHead|TableBody|TableContainer|Table|thead|tbody|th|td)\b/g],
  ['页面地标', /<(header|main|nav|aside|section|footer)\b/g],
  ['组件使用', /<(Button|TextField|Select|Dialog|Drawer|Chip|Tabs|Table)\b|Mui[A-Z][A-Za-z]+/g]
];
// 仅记录布局证据，不把某个项目的列数擅自升级成全局规则。
const layoutDetectors = {
  muiGridSize: /size\s*=\s*\{\{([^}]*)\}\}/g,
  cssGridColumns: /grid-template-columns\s*:\s*([^;}{]+)/g,
  tailwindGridColumns: /(?:^|[\s"'`])((?:sm|md|lg|xl):)?grid-cols-(\d+)(?=$|[\s"'`])/g
};
const fontLinkPattern = /<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
const fontFacePattern = /@font-face\s*\{[^}]+\}/gi;

async function collectFiles(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || ignoredFiles.has(entry.name) || entry.name.startsWith('.env')) continue;
    const target = path.join(directory, entry.name);
    const normalizedTarget = target.replaceAll('\\', '/');
    if (/\/docs\/app\/assets\//.test(normalizedTarget)) continue;
    if (path.resolve(target) === outputRoot || path.resolve(target).startsWith(`${outputRoot}${path.sep}`)) continue;
    if (entry.isDirectory()) await collectFiles(target, files);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) files.push(target);
  }
  return files;
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

function normalize(category, value) {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return category === 'color' ? trimmed.toLowerCase() : trimmed;
}

const inventory = new Map();
const structureInventory = new Map();
const layoutInventory = new Map();
const fontInventory = new Map();
function addLayoutEvidence({ kind, value, source, evidence }) {
  const key = `${kind}\u0000${value}`;
  const item = layoutInventory.get(key) ?? { kind, value, count: 0, sources: [], evidence };
  item.count += 1;
  if (item.sources.length < 20) item.sources.push(source);
  layoutInventory.set(key, item);
}
function addFontEvidence({ kind, value, source, evidence }) {
  const key = `${kind}\u0000${value}`;
  const item = fontInventory.get(key) ?? { kind, value, count: 0, sources: [], evidence };
  item.count += 1;
  if (item.sources.length < 20) item.sources.push(source);
  fontInventory.set(key, item);
}
for (const file of await collectFiles(projectRoot)) {
  const content = await readFile(file, 'utf8');
  const relativeFile = path.relative(projectRoot, file).replaceAll('\\', '/');
  for (const [category, pattern] of detectors) {
    if (category === 'duration' && /(?:^|\/)mockData\.[cm]?[jt]sx?$/.test(relativeFile)) continue;
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const captured = match[1] ?? match[0];
      const value = normalize(category, captured);
      if (!value || value.length > 240) continue;
      const key = `${category}\u0000${value}`;
      const item = inventory.get(key) ?? { category, value, count: 0, sources: [] };
      item.count += 1;
      if (item.sources.length < 20) {
        item.sources.push(`${relativeFile}:${lineNumber(content, match.index)}`);
      }
      inventory.set(key, item);
    }
  }
  for (const [kind, pattern] of structureDetectors) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const value = (match[1] ?? match[2] ?? match[0]).replaceAll('<', '').trim();
      const key = `${kind}\u0000${value}`;
      const item = structureInventory.get(key) ?? { kind, value, count: 0, sources: [] };
      item.count += 1;
      if (item.sources.length < 20) item.sources.push(`${relativeFile}:${lineNumber(content, match.index)}`);
      structureInventory.set(key, item);
    }
  }
  layoutDetectors.muiGridSize.lastIndex = 0;
  for (const match of content.matchAll(layoutDetectors.muiGridSize)) {
    const spans = [...match[1].matchAll(/\b(xs|sm|md|lg|xl)\s*:\s*(\d+)/g)];
    for (const span of spans) {
      const breakpoint = span[1];
      const columnsSpan = Number(span[2]);
      const columns = columnsSpan > 0 && 12 % columnsSpan === 0 ? 12 / columnsSpan : null;
      const value = `MUI Grid ${breakpoint}=${columnsSpan}/12${columns ? `（${columns}列）` : ''}`;
      addLayoutEvidence({
        kind: '响应式栅格',
        value,
        source: `${relativeFile}:${lineNumber(content, match.index)}`,
        evidence: { library: 'MUI Grid', breakpoint, span: columnsSpan, columns }
      });
    }
  }
  layoutDetectors.cssGridColumns.lastIndex = 0;
  for (const match of content.matchAll(layoutDetectors.cssGridColumns)) {
    const value = match[1].trim();
    if (!value) continue;
    addLayoutEvidence({
      kind: 'CSS 栅格列定义',
      value,
      source: `${relativeFile}:${lineNumber(content, match.index)}`,
      evidence: { declaration: 'grid-template-columns', value }
    });
  }
  layoutDetectors.tailwindGridColumns.lastIndex = 0;
  for (const match of content.matchAll(layoutDetectors.tailwindGridColumns)) {
    const breakpoint = match[1]?.replace(':', '') || 'base';
    const columns = Number(match[2]);
    addLayoutEvidence({
      kind: 'Tailwind 栅格列定义',
      value: `${breakpoint}=${columns}列`,
      source: `${relativeFile}:${lineNumber(content, match.index)}`,
      evidence: { breakpoint, columns }
    });
  }
  fontLinkPattern.lastIndex = 0;
  for (const match of content.matchAll(fontLinkPattern)) {
    const href = match[1];
    if (!/(fonts\.googleapis\.com\/css|\.woff2?(?:\?|$)|\.ttf(?:\?|$)|\.otf(?:\?|$))/i.test(href)) continue;
    const familyValues = [...href.matchAll(/family=([^&]+)/gi)].map((item) => decodeURIComponent(item[1]).replaceAll('+', ' '));
    addFontEvidence({
      kind: '字体资源声明',
      value: href,
      source: `${relativeFile}:${lineNumber(content, match.index)}`,
      evidence: { families: familyValues, status: 'declared' }
    });
  }
  fontFacePattern.lastIndex = 0;
  for (const match of content.matchAll(fontFacePattern)) {
    const block = match[0];
    const family = block.match(/font-family\s*:\s*["']?([^;"'}]+)/i)?.[1]?.trim();
    const weight = block.match(/font-weight\s*:\s*([^; }]+)/i)?.[1]?.trim();
    const sourceValue = block.match(/src\s*:\s*([^;]+)/i)?.[1]?.trim();
    if (!family) continue;
    addFontEvidence({
      kind: '@font-face',
      value: `${family}${weight ? ` / ${weight}` : ''}`,
      source: `${relativeFile}:${lineNumber(content, match.index)}`,
      evidence: { family, weight: weight ?? null, src: sourceValue ?? null, status: 'declared' }
    });
  }
}

const items = [...inventory.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category) || a.value.localeCompare(b.value));
const grouped = items.reduce((result, item) => {
  (result[item.category] ??= []).push(item);
  return result;
}, {});
const typeByCategory = {
  'css-variable': 'string',
  'font-family': 'fontFamily',
  'font-weight': 'fontWeight'
};
const candidateTokens = {};
for (const item of items.filter((entry) => entry.count >= 2)) {
  const slug = item.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'value';
  let name = `candidate.${item.category}.${slug}`;
  let suffix = 2;
  while (candidateTokens[name]) name = `candidate.${item.category}.${slug}-${suffix++}`;
  candidateTokens[name] = {
    $type: typeByCategory[item.category] ?? item.category,
    $value: item.value,
    $description: `机械提取候选值，共出现 ${item.count} 次；正式命名前需结合使用语义确认。`,
    $extensions: {
      project: {
        layer: 'primitive',
        status: 'draft',
        scope: [],
        platforms: ['web'],
        source: item.sources[0],
        occurrences: item.count,
        sources: item.sources
      }
    }
  };
}

await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'raw-inventory.json'), `${JSON.stringify({ project: projectRoot, generatedAt: new Date().toISOString(), items }, null, 2)}\n`);
await writeFile(path.join(outputRoot, 'candidate-tokens.json'), `${JSON.stringify(candidateTokens, null, 2)}\n`);
await writeFile(path.join(outputRoot, 'structure-inventory.json'), `${JSON.stringify({ project: projectRoot, generatedAt: new Date().toISOString(), items: [...structureInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value)) }, null, 2)}\n`);
await writeFile(path.join(outputRoot, 'layout-inventory.json'), `${JSON.stringify({ project: projectRoot, generatedAt: new Date().toISOString(), items: [...layoutInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value)) }, null, 2)}\n`);
await writeFile(path.join(outputRoot, 'font-inventory.json'), `${JSON.stringify({ project: projectRoot, generatedAt: new Date().toISOString(), runtimeVerification: '未执行浏览器运行时验证', items: [...fontInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value)) }, null, 2)}\n`);

const categoryNames = { color: '颜色', dimension: '尺寸', duration: '时长', shadow: '阴影', 'font-weight': '字重', 'font-family': '字体', 'css-variable': 'CSS 变量' };
const sections = Object.entries(grouped).map(([category, entries]) => {
  const rows = entries.slice(0, 30).map((item) => `| \`${item.value.replaceAll('|', '\\|')}\` | ${item.count} | ${item.sources.slice(0, 3).join('<br>')} |`).join('\n');
  return `## ${categoryNames[category] ?? category}\n\n| 值 | 次数 | 示例来源 |\n|---|---:|---|\n${rows}`;
});
const structureSections = [...structureInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value));
const structureReport = structureSections.length
  ? `## 语义结构证据\n\n以下证据用于提醒模型检查标题、表格、页面地标和组件的语义上下文，不会自动升级为正式 Token。\n\n| 类型 | 语义 | 次数 | 示例来源 |\n|---|---|---:|---|\n${structureSections.slice(0, 80).map((item) => `| ${item.kind} | \`${item.value}\` | ${item.count} | ${item.sources.slice(0, 3).join('<br>')} |`).join('\n')}`
  : '';
const layoutSections = [...layoutInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value));
const layoutReport = layoutSections.length
  ? `## 布局证据\n\n以下内容来自源码中的栅格/列定义，只用于发现实际存在的布局模式；模型仍需阅读上下文，确认它是页面模板、组件网格还是局部布局。\n\n| 类型 | 定义 | 次数 | 示例来源 |\n|---|---|---:|---|\n${layoutSections.slice(0, 100).map((item) => `| ${item.kind} | \`${item.value}\` | ${item.count} | ${item.sources.slice(0, 3).join('<br>')} |`).join('\n')}`
  : '';
const fontSections = [...fontInventory.values()].sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value));
const fontReport = fontSections.length
  ? `## 字体资源证据\n\n以下内容只说明源码声明了哪些字体资源；是否成功下载、浏览器最终使用哪个字体，仍需运行时检查。\n\n| 类型 | 声明 | 示例来源 |\n|---|---|---|\n${fontSections.slice(0, 50).map((item) => `| ${item.kind} | \`${item.value.replaceAll('|', '\\|')}\` | ${item.sources.slice(0, 3).join('<br>')} |`).join('\n')}`
  : '';
const report = `# Design Token 提取审计\n\n本报告是机械扫描清单，不代表已经批准的设计系统。候选名称和语义角色仍需根据源码证据确认。\n\n- 扫描文件：${(await collectFiles(projectRoot)).length}\n- 唯一值：${items.length}\n- 重复候选：${Object.keys(candidateTokens).length}\n- 布局证据：${layoutSections.length}\n- 字体资源声明：${fontSections.length}\n\n${sections.join('\n\n')}\n\n${structureReport}\n\n${layoutReport}\n\n${fontReport}\n\n## 待处理事项\n\n- 将稳定且有意图的值分配给基础 Token。\n- 分离数值相同但语义不同的使用场景。\n- 聚类近似值，并判断它们是历史漂移还是刻意差异。\n- 将实际用途映射到语义 Token 和组件 Token。\n- 根据语义结构和布局证据补充页面布局、标题层级和组件部件配方。\n- 区分页面壳层、页面模板、重复卡片网格和局部栅格，不能把整页源码复制进模板。\n- 检查主题、状态、响应式、动效和无障碍完整性。\n- 对字体资源执行浏览器运行时验证，确认请求成功、字体族和实际渲染字体，而不是只看 font-family 字符串。\n`;
await writeFile(path.join(outputRoot, 'audit-report.md'), report);
console.log(`扫描完成：提取 ${items.length} 个唯一值、${layoutInventory.size} 条布局证据，结果写入 ${outputRoot}`);

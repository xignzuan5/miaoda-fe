#!/usr/bin/env node
import { access, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const targetRoot = path.resolve(process.cwd());
const input = process.argv.slice(2);
const args = {};
for (let index = 0; index < input.length; index += 1) {
  if (!input[index].startsWith('--')) continue;
  const name = input[index].slice(2);
  args[name] = input[index + 1]?.startsWith('--') ? true : (input[++index] ?? true);
}

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

const extractor = path.join(targetRoot, '.agents', 'skills', 'extract-design-tokens', 'scripts', 'extract-tokens.mjs');
if (!await exists(extractor)) {
  console.error('未找到抽取 Skill。请先在项目中执行一次脚手架初始化，再运行 npm run project:init。');
  process.exit(2);
}

const designSystemRoot = path.join(targetRoot, 'design-system');
const auditRoot = path.join(designSystemRoot, 'audit');
await mkdir(auditRoot, { recursive: true });
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
  console.log(`Token 产物已构建：${path.join(designSystemRoot, 'dist')}`);
}
console.log(`项目审计已刷新：${auditRoot}`);

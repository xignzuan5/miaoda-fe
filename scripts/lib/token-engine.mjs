import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const ALIAS_PATTERN = /^\{([^}]+)\}$/;
export const NAME_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
export const ALLOWED_TYPES = new Set([
  'boolean', 'color', 'dimension', 'number', 'fontFamily', 'fontWeight',
  'duration', 'cubicBezier', 'shadow', 'strokeStyle', 'border',
  'gradient', 'typography', 'transition', 'string'
]);

export async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listJsonFiles(target));
    if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files.sort();
}

export function tokenEntries(document) {
  return Object.entries(document).filter(([name]) => !name.startsWith('$'));
}

export async function loadDirectory(directory) {
  const result = {};
  const origins = {};
  for (const file of await listJsonFiles(directory)) {
    const document = await readJson(file);
    for (const [name, token] of tokenEntries(document)) {
      if (result[name]) throw new Error(`重复 Token：${name}\n  ${origins[name]}\n  ${file}`);
      result[name] = token;
      origins[name] = file;
    }
  }
  return { tokens: result, origins };
}

export async function loadFile(file) {
  const document = await readJson(file);
  return Object.fromEntries(tokenEntries(document));
}

export function mergeTokenSets(...sets) {
  return Object.assign({}, ...sets);
}

export function resolveTokens(tokens) {
  const resolved = {};
  const resolving = [];

  function resolve(name) {
    if (resolved[name]) return resolved[name];
    const token = tokens[name];
    if (!token) throw new Error(`Token 引用了不存在的别名：${name}`);
    if (resolving.includes(name)) {
      throw new Error(`检测到循环引用：${[...resolving, name].join(' -> ')}`);
    }
    resolving.push(name);
    const match = typeof token.$value === 'string' && token.$value.match(ALIAS_PATTERN);
    if (match) {
      const target = resolve(match[1]);
      if (token.$type !== target.$type) {
        throw new Error(`别名类型不一致：${name} (${token.$type}) -> ${match[1]} (${target.$type})`);
      }
      resolved[name] = { ...token, $value: target.$value, $alias: match[1] };
    } else {
      resolved[name] = { ...token };
    }
    resolving.pop();
    return resolved[name];
  }

  for (const name of Object.keys(tokens)) resolve(name);
  return resolved;
}

export function validateTokens(tokens, label = 'tokens') {
  const errors = [];
  for (const [name, token] of Object.entries(tokens)) {
    if (!NAME_PATTERN.test(name)) errors.push(`${label}: Token 名称不合法：${name}`);
    if (!token || typeof token !== 'object' || Array.isArray(token)) {
      errors.push(`${label}: ${name} 必须是对象`);
      continue;
    }
    if (!ALLOWED_TYPES.has(token.$type)) errors.push(`${label}: ${name} 的 $type 不受支持：${token.$type}`);
    if (!('$value' in token)) errors.push(`${label}: ${name} 缺少 $value`);
    if (typeof token.$description !== 'string' || !token.$description.trim()) {
      errors.push(`${label}: ${name} 缺少 $description`);
    }
    const project = token.$extensions?.project;
    if (project?.status === 'deprecated' && !project.replacement) {
      errors.push(`${label}: 已弃用的 ${name} 必须在 $extensions.project.replacement 中声明替代项`);
    }
  }
  return errors;
}

export function cssVariable(name) {
  return `--${name.replaceAll('.', '-')}`;
}

export function formatCssValue(token) {
  return String(token.$value);
}

export function toNestedObject(tokens, valueSelector = (token) => token.$value) {
  const root = {};
  for (const [name, token] of Object.entries(tokens)) {
    const parts = name.split('.');
    let cursor = root;
    for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
    cursor[parts.at(-1)] = valueSelector(token);
  }
  return root;
}

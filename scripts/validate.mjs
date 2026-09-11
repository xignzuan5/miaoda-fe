import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDirectory, loadFile, mergeTokenSets, readJson,
  resolveTokens, validateTokens
} from './lib/token-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = await readJson(path.join(root, 'tokens.config.json'));
const primitive = await loadDirectory(path.join(root, config.source.primitives));
const components = await loadDirectory(path.join(root, config.source.components));
const errors = [
  ...validateTokens(primitive.tokens, 'primitives'),
  ...validateTokens(components.tokens, 'components')
];

const semanticKeys = new Map();
for (const [mode, relativeFile] of Object.entries(config.modes)) {
  const semantic = await loadFile(path.join(root, relativeFile));
  errors.push(...validateTokens(semantic, `mode:${mode}`));
  semanticKeys.set(mode, new Set(Object.keys(semantic)));

  for (const [theme, themeFile] of Object.entries(config.themes)) {
    const overrides = await loadFile(path.join(root, themeFile));
    errors.push(...validateTokens(overrides, `theme:${theme}`));
    try {
      resolveTokens(mergeTokenSets(primitive.tokens, semantic, components.tokens, overrides));
    } catch (error) {
      errors.push(`${theme}/${mode}: ${error.message}`);
    }
  }
}

const [referenceMode, referenceKeys] = semanticKeys.entries().next().value;
for (const [mode, keys] of semanticKeys) {
  for (const key of referenceKeys) if (!keys.has(key)) errors.push(`mode:${mode} 缺少语义 Token：${key}`);
  for (const key of keys) if (!referenceKeys.has(key)) errors.push(`mode:${mode} 多出语义 Token：${key}（基准模式：${referenceMode}）`);
}

if (errors.length) {
  console.error(`Token 校验失败，共 ${errors.length} 个问题：`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Token 校验通过：${Object.keys(primitive.tokens).length} 个基础 Token，${Object.keys(components.tokens).length} 个组件 Token，${semanticKeys.size} 个模式。`);
}

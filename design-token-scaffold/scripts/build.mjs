import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cssVariable, formatCssValue, loadDirectory, loadFile,
  mergeTokenSets, readJson, resolveTokens, toNestedObject
} from './lib/token-engine.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = await readJson(path.join(root, 'tokens.config.json'));
const output = path.join(root, config.output);
const { tokens: primitives } = await loadDirectory(path.join(root, config.source.primitives));
const { tokens: components } = await loadDirectory(path.join(root, config.source.components));
const builds = {};

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'json'), { recursive: true });
await mkdir(path.join(output, 'css'), { recursive: true });
await mkdir(path.join(output, 'typescript'), { recursive: true });

for (const [theme, themeFile] of Object.entries(config.themes)) {
  const overrides = await loadFile(path.join(root, themeFile));
  builds[theme] = {};
  for (const [mode, semanticFile] of Object.entries(config.modes)) {
    const semantic = await loadFile(path.join(root, semanticFile));
    const resolved = resolveTokens(mergeTokenSets(primitives, semantic, components, overrides));
    builds[theme][mode] = resolved;
    const json = {
      $meta: { theme, mode, generatedAt: new Date().toISOString() },
      tokens: toNestedObject(resolved),
      flat: Object.fromEntries(Object.entries(resolved).map(([name, token]) => [name, token.$value]))
    };
    await writeFile(path.join(output, 'json', `${theme}.${mode}.json`), `${JSON.stringify(json, null, 2)}\n`);
  }
}

const cssBlocks = [];
for (const [theme, modes] of Object.entries(builds)) {
  for (const [mode, tokens] of Object.entries(modes)) {
    const isDefault = theme === 'default' && mode === 'light';
    const selector = isDefault
      ? ':root, [data-theme="default"][data-mode="light"]'
      : `[data-theme="${theme}"][data-mode="${mode}"]`;
    const declarations = Object.entries(tokens)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, token]) => `  ${cssVariable(name)}: ${formatCssValue(token)};`)
      .join('\n');
    cssBlocks.push(`${selector} {\n${declarations}\n}`);
  }
}

cssBlocks.push(`@media (prefers-reduced-motion: reduce) {\n  :root {\n    --motion-duration-fast: 0ms;\n    --motion-duration-normal: 0ms;\n    --motion-duration-slow: 0ms;\n  }\n}`);
await writeFile(path.join(output, 'css', 'tokens.css'), `/* Generated file. Do not edit. */\n${cssBlocks.join('\n\n')}\n`);

const defaultLight = builds.default.light;
const names = Object.keys(defaultLight).sort();
const ts = `// Generated file. Do not edit.\nexport const tokens = ${JSON.stringify(toNestedObject(defaultLight), null, 2)} as const;\n\nexport const flatTokens = ${JSON.stringify(Object.fromEntries(names.map((name) => [name, defaultLight[name].$value])), null, 2)} as const;\n\nexport type TokenName = keyof typeof flatTokens;\nexport type ThemeName = ${Object.keys(builds).map((name) => JSON.stringify(name)).join(' | ')};\nexport type ModeName = ${Object.keys(config.modes).map((name) => JSON.stringify(name)).join(' | ')};\n`;
await writeFile(path.join(output, 'typescript', 'tokens.generated.ts'), ts);

const manifest = Object.fromEntries(names.map((name) => [name, {
  type: defaultLight[name].$type,
  description: defaultLight[name].$description,
  cssVariable: cssVariable(name)
}]));
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`构建完成：${names.length} 个 Token，${Object.keys(builds).length} 个主题 × ${Object.keys(config.modes).length} 个模式。`);

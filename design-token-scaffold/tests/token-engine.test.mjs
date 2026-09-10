import assert from 'node:assert/strict';
import test from 'node:test';
import { cssVariable, resolveTokens, toNestedObject, validateTokens } from '../scripts/lib/token-engine.mjs';

test('递归解析别名并保留最终类型', () => {
  const resolved = resolveTokens({
    'color.blue.500': { $type: 'color', $value: '#2563eb', $description: '蓝色' },
    'color.action': { $type: 'color', $value: '{color.blue.500}', $description: '操作色' },
    'button.background': { $type: 'color', $value: '{color.action}', $description: '按钮背景' }
  });
  assert.equal(resolved['button.background'].$value, '#2563eb');
  assert.equal(resolved['button.background'].$alias, 'color.action');
});

test('拒绝循环引用', () => {
  assert.throws(() => resolveTokens({
    a: { $type: 'color', $value: '{b}', $description: 'a' },
    b: { $type: 'color', $value: '{a}', $description: 'b' }
  }), /循环引用/);
});

test('拒绝不同类型之间的别名', () => {
  assert.throws(() => resolveTokens({
    color: { $type: 'color', $value: '#fff', $description: '颜色' },
    size: { $type: 'dimension', $value: '{color}', $description: '尺寸' }
  }), /类型不一致/);
});

test('校验名称与必填元数据', () => {
  const errors = validateTokens({ 'Bad Name': { $type: 'unknown', $value: 1 } });
  assert.equal(errors.length, 3);
});

test('生成 CSS 变量名和嵌套对象', () => {
  assert.equal(cssVariable('color.text.primary'), '--color-text-primary');
  assert.deepEqual(toNestedObject({
    'color.text.primary': { $value: '#000' }
  }), { color: { text: { primary: '#000' } } });
});

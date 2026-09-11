import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyFailure,
  normalizeRemote,
  parseAheadBehind,
  parseAppId,
  parseArgs,
  redactOutput,
  validateSyncPaths,
} from '../scripts/lib/miaoda-sync.mjs';

test('从妙搭链接和 app_id 提取应用 ID', () => {
  assert.equal(parseAppId('app_17ds4108438'), 'app_17ds4108438');
  assert.equal(parseAppId('https://miaoda.feishu.cn/app/app_17ds4108438?from=aily'), 'app_17ds4108438');
  assert.throws(() => parseAppId('not-an-app'), /无法识别妙搭应用 ID/);
});

test('解析同步子命令和多个路径参数', () => {
  const parsed = parseArgs(['push', '--paths', 'design-system', 'client/src/pages/A', '--yes']);
  assert.equal(parsed.command, 'push');
  assert.deepEqual(parsed.options.paths, ['design-system', 'client/src/pages/A']);
  assert.equal(parsed.options.yes, true);
});

test('只允许相对源码路径参与推送', () => {
  assert.deepEqual(validateSyncPaths(['design-system', 'client/src/pages/A', 'design-system']), ['design-system', 'client/src/pages/A']);
  assert.throws(() => validateSyncPaths(['.agent']), /拒绝提交受保护路径/);
  assert.throws(() => validateSyncPaths(['../other-project']), /拒绝提交受保护路径/);
  assert.throws(() => validateSyncPaths(['.env']), /拒绝提交受保护路径/);
});

test('解析 Git 提交领先和落后数量', () => {
  assert.deepEqual(parseAheadBehind('2\t3\n'), { ahead: 2, behind: 3 });
});

test('归一化远端地址并脱敏错误输出', () => {
  assert.equal(normalizeRemote('https://Example.com/team/app.git/'), 'https://example.com/team/app.git');
  assert.equal(redactOutput('https://user:secret@example.com/app.git?token=abc'), 'https://[已隐藏]@example.com/app.git?token=[已隐藏]');
  assert.match(classifyFailure('remote: 403 forbidden'), /权限不足/);
  assert.match(classifyFailure('getaddrinfo ENOTFOUND'), /网络连接失败/);
  assert.match(classifyFailure('authorization failed: The app is pending approval'), /应用尚未通过审批/);
  assert.match(classifyFailure('need_user_authorization (user: )'), /auth login --domain apps/);
});

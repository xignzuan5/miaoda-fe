import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyFailure,
  hasUnGrantedMiaodaScopes,
  pendingApprovalGuide,
  pendingApprovalWaitingGuide,
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
  assert.equal(parseAppId('cli_aa290067df385cbc'), 'cli_aa290067df385cbc');
  assert.equal(parseAppId('custom-app-id'), 'custom-app-id');
  assert.throws(() => parseAppId('not an app id'), /无法读取应用 ID/);
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
  assert.equal(hasUnGrantedMiaodaScopes('以下是本次未授予的权限：\n  spark:app:read、spark:app:write'), true);
  assert.equal(hasUnGrantedMiaodaScopes('本次已成功授权：\n  spark:app:read、spark:app:write'), false);
  assert.match(classifyFailure('本次已成功授权：\n  （空）\n以下是本次未授予的权限：\n  spark:app:read、spark:app:write'), /spark:app:read.*未被授予/);
  const approvalGuide = pendingApprovalGuide();
  assert.match(approvalGuide, /weikezhijia\.feishu\.cn\/share\/base\/form/);
  assert.match(approvalGuide, /应用使用人员范围/);
  assert.match(approvalGuide, /是否完成 Channel 配置.*否/);
  assert.doesNotMatch(approvalGuide, /config init --app-id/);
  assert.match(approvalGuide, /重新运行 npm run miaoda:init/);
  const waitingGuide = pendingApprovalWaitingGuide();
  assert.match(waitingGuide, /等待管理员/);
  assert.match(waitingGuide, /新的 CLI app_id/);
  assert.match(classifyFailure('need_user_authorization (user: )'), /spark:app:read spark:app:write/);
  assert.match(classifyFailure('not_configured'), /管理员提供的 CLI app_id/);
  assert.doesNotMatch(classifyFailure('not_configured'), /config init --new/);
  assert.match(classifyFailure('命令执行超时（120000ms）'), /网络连接失败/);
});

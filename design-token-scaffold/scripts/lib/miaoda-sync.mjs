import path from 'node:path';

export const DEFAULT_BRANCH = 'sprint/default';
export const SYNC_CONFIG_FILE = '.miaoda-sync.local.json';

const BOOLEAN_OPTIONS = new Set(['debug', 'force', 'miaoda', 'skip-extract', 'yes']);

/**
 * 解析妙搭同步命令参数。命令只保存项目元数据，不接受密码或 Token。
 */
export function parseArgs(argv) {
  let command = 'init';
  let index = 0;
  if (argv[0] && !argv[0].startsWith('--')) {
    command = argv[0];
    index = 1;
  }

  const options = { _: [] };
  while (index < argv.length) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      options._.push(token);
      index += 1;
      continue;
    }

    const name = token.slice(2);
    if (BOOLEAN_OPTIONS.has(name)) {
      options[name] = true;
      index += 1;
      continue;
    }

    if (name === 'paths') {
      const values = [];
      index += 1;
      while (index < argv.length && !argv[index].startsWith('--')) {
        values.push(...argv[index].split(','));
        index += 1;
      }
      options.paths = [...(options.paths ?? []), ...values.filter(Boolean)];
      continue;
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      options[name] = true;
      index += 1;
      continue;
    }
    options[name] = value;
    index += 2;
  }

  return { command, options };
}

export function parseAppId(input) {
  const value = String(input ?? '').trim();
  if (/^app_[A-Za-z0-9_-]+$/.test(value)) return value;
  const match = value.match(/\/app\/(app_[A-Za-z0-9_-]+)(?:[/?#]|$)/i);
  if (match) return match[1];
  throw new Error('无法识别妙搭应用 ID。请输入 app_ 开头的应用 ID，或完整的妙搭应用链接。');
}

export function normalizeRemote(remote) {
  const value = String(remote ?? '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    // 远端地址不应包含 userinfo；比较时也不回显其中的敏感字段。
    return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '').toLowerCase();
  } catch {
    return value.replace(/\/$/, '').toLowerCase();
  }
}

export function extractRepositoryUrl(output) {
  try {
    const json = parseJsonEnvelope(output);
    const candidate = json?.data?.repository_url ?? json?.repository_url;
    if (candidate) return String(candidate);
  } catch {
    // 继续尝试从 CLI 的文本输出中提取地址。
  }
  const match = String(output ?? '').match(/https?:\/\/[^\s"']+\.git(?:[^\s"']*)?/i);
  return match?.[0]?.replace(/[),.;]+$/, '') ?? '';
}

export function parseJsonEnvelope(output) {
  const text = String(output ?? '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('CLI 没有返回 JSON 结果。');
  return JSON.parse(text.slice(start, end + 1));
}

export function parseAheadBehind(output) {
  const match = String(output ?? '').trim().match(/^(\d+)\s+(\d+)$/m);
  if (!match) throw new Error(`无法解析 Git 提交差异：${String(output ?? '').trim()}`);
  return { ahead: Number(match[1]), behind: Number(match[2]) };
}

export function validateSyncPaths(paths) {
  const values = [...new Set((paths ?? []).map((value) => String(value).trim()).filter(Boolean))];
  if (!values.length) throw new Error('没有指定需要提交的路径。请使用 --paths design-system client/src/...。');

  const forbidden = [];
  for (const value of values) {
    const normalized = value.replaceAll('\\', '/');
    const segments = normalized.split('/');
    if (path.isAbsolute(value) || segments.includes('..')) forbidden.push(value);
    if (segments.some((segment) => segment === '.agent' || segment === '.git' || segment === 'node_modules')) {
      forbidden.push(value);
    }
    if (segments.some((segment) => segment === '.env' || segment.startsWith('.env.'))) forbidden.push(value);
  }
  if (forbidden.length) {
    throw new Error(`拒绝提交受保护路径：${forbidden.join('、')}。请只指定项目源码和设计系统文件。`);
  }
  return values;
}

export function redactOutput(value) {
  return String(value ?? '')
    .replace(/(https?:\/\/)([^/@\s]+):([^/@\s]+)@/gi, '$1[已隐藏]@')
    .replace(/(token|secret|password|access_token)=([^&\s]+)/gi, '$1=[已隐藏]');
}

export function classifyFailure(value) {
  const text = String(value ?? '').toLowerCase();
  if (/need_user_authorization|token_missing|missing_scope/.test(text)) {
    return '妙搭用户授权或 apps scope 不足。请完成 lark-cli auth login --domain apps 后重试。';
  }
  if (/403|401|permission|forbidden|unauthorized|could not read username|credential|权限|拒绝访问/.test(text)) {
    return '权限不足或授权已过期。请确认飞书账号有该妙搭应用权限，并重新执行 lark-cli auth login。';
  }
  if (/not_configured|not configured|未配置/.test(text)) {
    return 'lark-cli 尚未完成应用配置。请先执行 lark-cli config init --new。';
  }
  if (/auth|login|登录|授权|user authorization/.test(text)) {
    return 'lark-cli 用户授权不足或已过期。请执行 lark-cli auth login --domain apps，并按浏览器提示完成授权。';
  }
  if (/enotfound|eai_again|timeout|timed out|network|proxy|网络|连接|白名单/.test(text)) {
    return '网络连接失败。请让网络管理员放行飞书授权/API 地址和 miaoda-git.feishu.cn:443。';
  }
  if (/non-fast-forward|diverg|分叉|远端有新提交/.test(text)) {
    return '本地和妙搭远端已经分叉。请先拉取并人工整合，脚手架不会强制覆盖任一侧。';
  }
  if (/branch|ref|分支/.test(text)) {
    return '找不到妙搭开发分支。请确认当前应用使用 sprint/default，或先核对 CLI 返回的分支。';
  }
  if (/working tree|unstaged|未提交|dirty/.test(text)) {
    return '工作区存在未提交改动。请先查看 git diff，脚手架不会自动丢弃或隐藏本地改动。';
  }
  return '请根据上面的步骤输出检查本机工具、网络、应用权限和 Git 工作区。';
}

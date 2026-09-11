import path from 'node:path';

export const DEFAULT_BRANCH = 'sprint/default';
export const SYNC_CONFIG_FILE = '.miaoda-sync.local.json';
// 公司 CLI 应用审批入口。可用环境变量替换，避免不同租户共用一条申请地址。
export const MIAODA_APPROVAL_FORM_URL = process.env.MIAODA_APPROVAL_FORM_URL
  || 'https://weikezhijia.feishu.cn/share/base/form/shrcnAaJOAVobcmnqc3DL3wEZDd';

export function pendingApprovalGuide() {
  return [
    'lark-cli 使用的 CLI/智能体应用尚未通过审批，仍处于“待审批”，当前账号不能完成授权。这个卡点不是妙搭应用 ID 或本地目录错误，暂时不要重复运行 npm run miaoda:init。',
    '',
    '请按下面顺序处理：',
    `第 1 步｜填写应用申请表：${MIAODA_APPROVAL_FORM_URL}`,
    '  - “应用使用人员范围”填写实际需要使用该妙搭应用的人员名单。',
    '  - “是否完成 Channel 配置”先选择“否”。',
    '  - 提交后等待公司审批，不要自行创建另一个 CLI 应用绕过审批。',
    '第 2 步｜等待管理员反馈凭证：',
    '  - 在飞书应用管理的机器人消息中查看管理员反馈的新 app_id 和 app_secret。',
    '  - app_secret 只在本机输入，不要粘贴到代码、工单、聊天记录或命令行参数中。',
    '第 3 步｜把管理员凭证绑定到本机 lark-cli（同一个终端逐条执行）：',
    '  lark-cli config init --app-id <管理员提供的 app_id> --app-secret-stdin --brand feishu',
    '  （命令提示输入 App Secret 时粘贴 secret；输入不会显示。）',
    '  lark-cli auth login --scope "spark:app:read spark:app:write"',
    '  lark-cli auth status',
    '第 4 步｜重新运行同步：',
    '  npm run miaoda:init',
    '  这里输入的仍是“目标妙搭应用”的链接或 app_id（例如 app_17d6...），不是管理员刚反馈的 CLI app_id；本地目录也可以继续使用原目录。',
    '第 5 步｜完成 Channel 和管理员回调配置：',
    '  - 在实际承载智能体的平台（如 Aily/妙搭）的智能体设置中打开“飞书 Channel/渠道”，按页面提示绑定已审批的应用并保存。',
    '  - 如果当前账号看不到 Channel 设置，停止操作并请管理员开通，不要反复执行同步命令。',
    '  - 配置完成后，把智能体名称/链接、CLI app_id 和 Channel 配置结果（不要发送 app_secret）同步给飞书管理员，由管理员添加事件与回调并确认开通。',
  ].join('\n');
}

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
  // 不在脚手架层硬编码应用 ID 前缀。妙搭链接仍会提取 /app/ 后的 ID，
  // 直接输入的非空 ID 原样交给 lark-cli，由服务端判断它是否属于目标应用。
  const match = value.match(/\/app\/(app_[A-Za-z0-9_-]+)(?:[/?#]|$)/i);
  if (match) return match[1];
  if (/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) return value;
  throw new Error('无法读取应用 ID。请输入非空的应用 ID，或包含 /app/<应用 ID> 的完整妙搭应用链接。');
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
  if (/pending approval|pending_approval|待审批|审批中|待审核/.test(text)) {
    return pendingApprovalGuide();
  }
  if (/need_user_authorization|token_missing|missing_scope/.test(text)) {
    return '妙搭用户授权或 spark scope 不足。请执行 lark-cli auth login --scope "spark:app:read spark:app:write"，在浏览器完成授权后，再重试原命令。';
  }
  if (/403|401|permission|forbidden|unauthorized|could not read username|credential|权限|拒绝访问/.test(text)) {
    return '权限不足或授权已过期。请确认飞书账号有该妙搭应用权限，并重新执行 lark-cli auth login。';
  }
  if (/not_configured|not configured|未配置/.test(text)) {
    return 'lark-cli 尚未完成应用配置。请先执行 lark-cli config init --new。';
  }
  if (/auth|login|登录|授权|user authorization/.test(text)) {
    return 'lark-cli 用户授权不足或已过期。请执行 lark-cli auth login --scope "spark:app:read spark:app:write"，并按浏览器提示完成授权。';
  }
  if (/enotfound|eai_again|timeout|timed out|超时|network|proxy|网络|连接|白名单/.test(text)) {
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

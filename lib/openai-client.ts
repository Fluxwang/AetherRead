import OpenAI from 'openai';

const AUTH_ERROR_HINT =
  '请确认：1) 当前服务进程已重启并加载最新 .env；2) OPENAI_API_KEY 是可用的 API Key（非短时会话令牌）；3) 若使用代理 baseURL，其平台上的令牌未过期。';
const QUOTA_ERROR_HINT = '当前 OpenAI 额度不足或已触达试用/账单限制，请充值后重试。';

const AUTH_ERROR_PATTERNS = [/\b401\b/, /令牌已过期/, /invalid[_\s-]?api[_\s-]?key/i];
const QUOTA_ERROR_PATTERNS = [
  /insufficient_quota/i,
  /exceeded your current quota/i,
  /daily limit/i,
  /rate limit reached/i,
  /add tokens to your account/i,
];

export class OpenAIQuotaError extends Error {
  status: number;

  constructor(message: string, status = 402) {
    super(message);
    this.name = 'OpenAIQuotaError';
    this.status = status;
  }
}

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const baseURL = process.env.OPENAI_BASE_URL?.trim();

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 未配置');
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  });
}

export function normalizeOpenAIError(error: unknown, context: string): Error {
  const message = getErrorMessage(error);
  const isAuthError = AUTH_ERROR_PATTERNS.some(pattern => pattern.test(message));
  const status = getErrorStatus(error);
  const isQuotaError =
    status === 402 ||
    status === 429 ||
    QUOTA_ERROR_PATTERNS.some(pattern => pattern.test(message));

  if (isQuotaError) {
    return new OpenAIQuotaError(`${context}失败：${QUOTA_ERROR_HINT} 原始错误: ${message}`, status || 402);
  }

  if (isAuthError) {
    return new Error(`${context}鉴权失败（401）。${AUTH_ERROR_HINT} 原始错误: ${message}`);
  }

  return error instanceof Error ? error : new Error(message);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStatus(error: unknown): number | null {
  const errorWithStatus = error as { status?: number; statusCode?: number } | null | undefined;
  if (!errorWithStatus || typeof errorWithStatus !== 'object') {
    return null;
  }
  const status = errorWithStatus.status ?? errorWithStatus.statusCode;
  return typeof status === 'number' ? status : null;
}

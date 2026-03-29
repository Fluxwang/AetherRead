// Jina Reader API Integration
// https://jina.ai/reader
import { fetch as undiciFetch, ProxyAgent } from 'undici';

const REQUEST_TIMEOUT_MS = Number(process.env.JINA_REQUEST_TIMEOUT_MS || 15000);
const MAX_RETRIES = Number(process.env.JINA_MAX_RETRIES || 2);
const RETRY_BACKOFF_MS = Number(process.env.JINA_RETRY_BACKOFF_MS || 800);
type UndiciResponse = Awaited<ReturnType<typeof undiciFetch>>;

export class JinaReaderError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number; cause?: unknown }) {
    super(message);
    this.name = 'JinaReaderError';
    this.code = options?.code;
    this.status = options?.status;

    if (options?.cause) {
      Object.defineProperty(this, 'cause', {
        value: options.cause,
        enumerable: false,
        configurable: true,
      });
    }
  }
}

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
const proxyAgent = proxyUrl ? new ProxyAgent(proxyUrl) : null;

/**
 * Fetches article content from a URL using Jina Reader API
 * Returns content in Markdown format
 * @param url - The article URL to fetch
 * @returns Promise resolving to markdown-formatted article content
 * @throws {JinaReaderError} If fetch fails after retries or times out
 */
export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await fetchWithRetry(url, 'application/json');
    const data = await response.json() as { content?: string; data?: { content?: string } };

    // Jina Reader returns markdown content
    return data.content || data.data?.content || '';
  } catch (error) {
    console.error('Error fetching article with Jina Reader:', error);
    throw error;
  }
}

/**
 * Fetches article content as plain text using Jina Reader API
 * @param url - The article URL to fetch
 * @returns Promise resolving to plain text content
 * @throws {JinaReaderError} If fetch fails after retries or times out
 */
export async function fetchArticleContentAsText(url: string): Promise<string> {
  try {
    const response = await fetchWithRetry(url, 'text/plain');
    return await response.text();
  } catch (error) {
    console.error('Error fetching article with Jina Reader:', error);
    throw error;
  }
}

async function fetchWithRetry(url: string, accept: string): Promise<UndiciResponse> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
  const maxAttempts = Math.max(1, MAX_RETRIES + 1);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await undiciFetch(jinaUrl, {
        dispatcher: proxyAgent || undefined,
        headers: {
          Accept: accept,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const message = `Jina Reader API failed: ${response.status}`;
        const isRetryable = response.status >= 500 || response.status === 429;
        const httpError = new JinaReaderError(message, { status: response.status, code: 'JINA_HTTP_ERROR' });

        if (!isRetryable || attempt === maxAttempts) {
          throw httpError;
        }

        lastError = httpError;
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableNetworkError(error);

      if (!retryable || attempt === maxAttempts) {
        break;
      }

      await sleep(RETRY_BACKOFF_MS * attempt);
    }
  }

  throw normalizeJinaError(lastError);
}

function normalizeJinaError(error: unknown): JinaReaderError {
  const causeCode = getCauseCode(error);

  if (causeCode === 'ETIMEDOUT' || causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
    return new JinaReaderError(
      '连接 Jina Reader 超时，请检查代理/网络连通性后重试',
      { code: 'JINA_TIMEOUT', cause: error }
    );
  }

  if (error instanceof JinaReaderError) {
    return error;
  }

  if (error instanceof Error) {
    return new JinaReaderError(error.message, { code: 'JINA_FETCH_ERROR', cause: error });
  }

  return new JinaReaderError('Jina Reader 抓取失败', { code: 'JINA_FETCH_ERROR', cause: error });
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof JinaReaderError) {
    return false;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  const code = getCauseCode(error);
  return ['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].includes(code);
}

function getCauseCode(error: unknown): string {
  const maybeError = error as { code?: string; cause?: { code?: string } };
  return maybeError?.cause?.code || maybeError?.code || '';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

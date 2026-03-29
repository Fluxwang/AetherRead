import { prisma } from '@/lib/prisma';
import { fetchArticleContentAsText } from '@/lib/jina-reader';
import { OpenAIQuotaError } from '@/lib/openai-client';
import { generateSummary } from '@/lib/openai-summary';
import { parseRSSFeed } from '@/lib/rss-parser';

export class ArticleWorkflowError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchAndSummarizeArticle(id: string) {
  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    throw new ArticleWorkflowError('文章不存在', 404);
  }

  await prisma.article.update({
    where: { id },
    data: {
      status: 'processing',
      summary: null,
    },
  });

  let content = article.originalContent;
  let title = article.title;

  if (article.originalUrl && !content) {
    try {
      if (article.sourceType === 'rss') {
        const articles = await parseRSSFeed(article.originalUrl);
        if (articles.length > 0) {
          const firstArticle = articles[0];
          title = firstArticle.title;
          content = firstArticle.content || '';

          if (content.length < 500 && firstArticle.link) {
            content = await fetchArticleContentAsText(firstArticle.link);
          }
        }
      } else {
        content = await fetchArticleContentAsText(article.originalUrl);

        const firstLine = content.split('\n')[0];
        title =
          firstLine.length > 0 && firstLine.length < 100
            ? firstLine
            : `${content.slice(0, 50)}...`;
      }
    } catch (error) {
      const message = toErrorMessage(error);
      await markArticleFetchFailed(id, `爬取失败: ${message}`);
      throw new ArticleWorkflowError('爬取文章失败', 500);
    }
  }

  if (!content || content.length < 10) {
    await markArticleFetchFailed(id, '无法获取文章内容');
    throw new ArticleWorkflowError('文章内容为空', 400);
  }

  const summary = await runWithFallback(
    () => generateSummary(content),
    'Error generating summary',
    '无法生成摘要',
    async (error) => {
      if (error instanceof OpenAIQuotaError) {
        await markArticleFetchFailed(id, `摘要失败: ${error.message}`);
        throw new ArticleWorkflowError('OpenAI 额度不足，请充值后重试', error.status);
      }
    }
  );

  const updatedArticle = await prisma.article.update({
    where: { id },
    data: {
      title,
      originalContent: content,
      summary,
      status: 'ready',
      translatedText: null,
      translationStatus: 'not_started',
      translationError: null,
    },
  });

  return updatedArticle;
}

export async function markArticleFetchFailed(id: string, summary: string): Promise<void> {
  await prisma.article.update({
    where: { id },
    data: {
      status: 'failed',
      summary,
    },
  });
}

async function runWithFallback<T>(
  task: () => Promise<T>,
  logPrefix: string,
  fallback: T,
  onError?: (error: unknown) => Promise<void> | void
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.error(`${logPrefix}:`, error);
    if (onError) {
      await onError(error);
    }
    return fallback;
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

// POST /api/articles/process/[id] - 兼容入口：抓取 + 摘要 + 全量翻译
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { translateContent } from '@/lib/openai-translate';
import { ArticleWorkflowError, fetchAndSummarizeArticle } from '@/lib/article-fetch';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fetchedArticle = await fetchAndSummarizeArticle(id);
    const translatedText = await runWithFallback(
      async () => {
        const bilingualParagraphs = await translateContent(fetchedArticle.originalContent);
        return JSON.stringify(bilingualParagraphs);
      },
      'Error translating content',
      JSON.stringify([])
    );

    const translationReady = hasValidTranslation(translatedText);

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        translatedText,
        translationStatus: translationReady ? 'ready' : 'failed',
        translationError: translationReady ? null : '无法生成翻译',
      },
    });

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error processing article:', error);

    if (error instanceof ArticleWorkflowError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: '处理文章失败' }, { status: 500 });
  }
}

async function runWithFallback<T>(task: () => Promise<T>, logPrefix: string, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.error(`${logPrefix}:`, error);
    return fallback;
  }
}

function hasValidTranslation(translatedText: string): boolean {
  try {
    const parsed = JSON.parse(translatedText);
    if (!Array.isArray(parsed)) {
      return false;
    }

    return parsed.some(
      (item) => typeof item?.zh === 'string' && item.zh.trim().length > 0
    );
  } catch {
    return false;
  }
}

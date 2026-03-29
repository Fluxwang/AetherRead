'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ArticleHeader from '@/app/components/ArticleHeader';
import ArticleSummary from '@/app/components/ArticleSummary';
import ReadingModeToggle from '@/app/components/ReadingModeToggle';
import ArticleContent from '@/app/components/ArticleContent';

interface Article {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  originalUrl?: string;
  originalContent?: string;
  translatedText?: string;
  summary?: string;
  createdAt: string;
}

type ReadingMode = 'english' | 'bilingual' | 'chinese';
const SUMMARY_FAILURE_MARKERS = ['无法生成摘要', '处理失败', '爬取失败'];

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>('bilingual');
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const fetchArticle = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await fetch(`/api/articles/${articleId}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      setArticle(data.article);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    if (!article || (article.status !== 'processing' && article.status !== 'pending')) {
      return;
    }

    const timer = setInterval(() => {
      fetchArticle({ silent: true });
    }, 2000);

    return () => clearInterval(timer);
  }, [article, fetchArticle]);

  const isSummaryFailed = (summary?: string) => {
    const value = summary?.trim() || '';
    if (!value) return true;
    return SUMMARY_FAILURE_MARKERS.some((marker) => value.includes(marker));
  };

  const isTranslationFailed = (translatedText?: string) => {
    if (!translatedText?.trim()) return true;

    try {
      const parsed = JSON.parse(translatedText);
      if (!Array.isArray(parsed) || parsed.length === 0) return true;

      return !parsed.some(
        (item) =>
          typeof item?.zh === 'string' && item.zh.trim().length > 0
      );
    } catch {
      return true;
    }
  };

  const handleRetry = async () => {
    if (!article) return;

    try {
      setRetrying(true);
      setRetryError(null);
      setError(null);

      const response = await fetch(`/api/articles/process/${article.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '重试失败');
      }

      await fetchArticle({ silent: true });
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : '重试失败，请稍后再试');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="surface-card flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--accent)] border-r-transparent" />
          <p className="mt-3 text-sm text-[color:var(--foreground-secondary)]">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
          ← 返回首页
        </Link>
        <div className="surface-card border-[color:color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] p-4">
          <p className="text-sm text-[color:var(--danger)]">{error || '文章不存在'}</p>
        </div>
      </div>
    );
  }

  if (article.status !== 'ready') {
    return (
      <div className="space-y-4">
        <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
          ← 返回首页
        </Link>
        <div className="surface-card p-5">
          <h1 className="mb-4 text-xl font-semibold text-[color:var(--foreground)]">
            {article.title || '处理中...'}
          </h1>
          <div className="flex items-center">
              {article.status === 'processing' && (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-[color:var(--accent)] border-r-transparent" />
                  <p className="text-sm text-[color:var(--accent)]">正在处理文章...</p>
                </>
              )}
              {article.status === 'pending' && (
                <p className="text-sm text-[color:var(--foreground-secondary)]">文章等待处理</p>
              )}
              {article.status === 'failed' && (
                <div className="w-full">
                  <p className="mb-3 text-sm text-[color:var(--danger)]">文章处理失败</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="btn-primary px-4 text-sm"
                  >
                    {retrying ? '重试中...' : '重新生成 AI 摘要与翻译'}
                  </button>
                </div>
              )}
            </div>
            {retryError && (
              <p className="mt-3 text-sm text-[color:var(--danger)]">{retryError}</p>
            )}
        </div>
      </div>
    );
  }

  const summaryFailed = isSummaryFailed(article.summary);
  const translationFailed = isTranslationFailed(article.translatedText);
  const shouldShowRetry = summaryFailed || translationFailed;

  return (
    <div className="space-y-4">
      <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
        ← 返回首页
      </Link>

      <div className="surface-card overflow-hidden">
        <div className="p-4">
          <ArticleHeader
            title={article.title}
            originalUrl={article.originalUrl}
            createdAt={article.createdAt}
          />

          {article.summary && (
            <div className="mt-5">
              <ArticleSummary summary={article.summary} />
            </div>
          )}

          {shouldShowRetry && (
            <div className="mt-5 rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_12%,var(--background-elevated))] p-4">
              <p className="text-sm text-[color:var(--warning)]">AI 处理失败，可重试。</p>
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="btn-primary mt-3 px-4 text-sm"
              >
                {retrying ? '重试中...' : '重新生成 AI 摘要与翻译'}
              </button>
              {retryError && (
                <p className="mt-2 text-sm text-[color:var(--danger)]">{retryError}</p>
              )}
            </div>
          )}

          <div className="mt-5 border-t border-[color:var(--border)] pt-5">
            <ReadingModeToggle
              currentMode={mode}
              onModeChange={setMode}
            />
          </div>
        </div>

        <div className="border-t border-[color:var(--border)]">
          <ArticleContent
            originalContent={article.originalContent || ''}
            translatedText={article.translatedText || ''}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}

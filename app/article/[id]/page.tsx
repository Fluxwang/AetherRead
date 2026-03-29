'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ArticleHeader from '@/app/components/ArticleHeader';
import ArticleSummary from '@/app/components/ArticleSummary';
import ReadingModeToggle from '@/app/components/ReadingModeToggle';
import ArticleContent from '@/app/components/ArticleContent';
import ThemeToggle from '@/app/components/ThemeToggle';

type OwnerTag = 'Wang' | 'LYY';
type TranslationStatus = 'not_started' | 'processing' | 'ready' | 'failed';

interface Article {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  originalUrl?: string;
  ownerTag: OwnerTag;
  isRead: boolean;
  readAt?: string | null;
  originalContent?: string;
  translatedText?: string;
  summary?: string;
  translationStatus?: TranslationStatus;
  translationError?: string | null;
  createdAt: string;
}

type ReadingMode = 'english' | 'bilingual' | 'chinese';
const SUMMARY_FAILURE_MARKERS = ['无法生成摘要', '处理失败', '爬取失败'];

function normalizeTranslationStatus(value?: string): TranslationStatus {
  if (value === 'processing' || value === 'ready' || value === 'failed') {
    return value;
  }
  return 'not_started';
}

function getTranslatedCount(translatedText?: string): number {
  if (!translatedText?.trim()) {
    return 0;
  }

  try {
    const parsed = JSON.parse(translatedText);
    if (!Array.isArray(parsed)) {
      return 0;
    }

    return parsed.filter(
      (item) => typeof item?.zh === 'string' && item.zh.trim().length > 0
    ).length;
  } catch {
    return 0;
  }
}

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>('english');
  const [retryingFetch, setRetryingFetch] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [updatingReadState, setUpdatingReadState] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<{ completed: number; total: number } | null>(null);
  const translationSourceRef = useRef<EventSource | null>(null);

  const closeTranslationSource = useCallback(() => {
    if (translationSourceRef.current) {
      translationSourceRef.current.close();
      translationSourceRef.current = null;
    }
  }, []);

  const fetchArticle = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await fetch(`/api/articles/${articleId}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      const fetchedArticle = data.article as Article;

      setArticle({
        ...fetchedArticle,
        translationStatus: normalizeTranslationStatus(fetchedArticle.translationStatus),
        translationError: fetchedArticle.translationError || null,
      });
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
    return () => {
      closeTranslationSource();
    };
  }, [closeTranslationSource]);

  useEffect(() => {
    if (!article || (article.status !== 'processing' && article.status !== 'pending')) {
      return;
    }

    const timer = setInterval(() => {
      fetchArticle({ silent: true });
    }, 2000);

    return () => clearInterval(timer);
  }, [article, fetchArticle]);

  useEffect(() => {
    if (!article || article.status !== 'ready' || article.isRead) {
      return;
    }

    let cancelled = false;
    const markAsRead = async () => {
      try {
        const response = await fetch(`/api/articles/${article.id}/read`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        });
        if (!response.ok || cancelled) return;

        const data = await response.json();
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                isRead: data.article?.isRead ?? true,
                readAt: data.article?.readAt ?? new Date().toISOString(),
              }
            : prev
        );
      } catch (markError) {
        console.error('Error auto marking article as read:', markError);
      }
    };

    void markAsRead();
    return () => {
      cancelled = true;
    };
  }, [article]);

  const isSummaryFailed = (summary?: string) => {
    const value = summary?.trim() || '';
    if (!value) return true;
    return SUMMARY_FAILURE_MARKERS.some((marker) => value.includes(marker));
  };

  const handleRetryFetch = async () => {
    if (!article) return;

    try {
      setRetryingFetch(true);
      setRetryError(null);
      setError(null);

      const response = await fetch(`/api/articles/fetch/${article.id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '重试抓取失败');
      }

      await fetchArticle({ silent: true });
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : '重试抓取失败，请稍后再试');
    } finally {
      setRetryingFetch(false);
    }
  };

  const handleStartTranslation = () => {
    if (!article || article.status !== 'ready') {
      return;
    }

    closeTranslationSource();
    setTranslationError(null);
    setTranslationProgress(null);
    setTranslating(true);

    const source = new EventSource(`/api/articles/translate/${article.id}/stream`);
    translationSourceRef.current = source;

    const closeCurrentSource = () => {
      source.close();
      if (translationSourceRef.current === source) {
        translationSourceRef.current = null;
      }
    };

    source.addEventListener('start', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        total: number;
        completed: number;
      };
      setTranslationProgress({ completed: data.completed, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: 'processing',
              translationError: null,
            }
          : prev
      );
    });

    source.addEventListener('chunk', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        translatedText?: string;
        completed: number;
        total: number;
      };

      setTranslationProgress({ completed: data.completed, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translatedText: data.translatedText ?? prev.translatedText,
              translationStatus: 'processing',
              translationError: null,
            }
          : prev
      );
    });

    source.addEventListener('done', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        translatedText?: string;
        total: number;
      };

      setTranslationProgress({ completed: data.total, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translatedText: data.translatedText ?? prev.translatedText,
              translationStatus: 'ready',
              translationError: null,
            }
          : prev
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.addEventListener('aborted', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        completed: number;
        total: number;
      };

      setTranslationProgress({ completed: data.completed, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: 'not_started',
            }
          : prev
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.addEventListener('translate_error', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as { message?: string };
      const message = data.message || '翻译失败';

      setTranslationError(message);
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: 'failed',
              translationError: message,
            }
          : prev
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.onerror = () => {
      if (translationSourceRef.current !== source) {
        return;
      }

      setTranslationError('翻译连接中断，请重试');
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: 'failed',
              translationError: '翻译连接中断',
            }
          : prev
      );
      setTranslating(false);
      closeCurrentSource();
    };
  };

  const handleToggleRead = async () => {
    if (!article) return;

    try {
      setUpdatingReadState(true);
      const nextReadState = !article.isRead;
      const response = await fetch(`/api/articles/${article.id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: nextReadState }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '更新已读状态失败');
      }

      const data = await response.json();
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              isRead: data.article?.isRead ?? nextReadState,
              readAt: data.article?.readAt ?? (nextReadState ? new Date().toISOString() : null),
            }
          : prev
      );
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : '更新已读状态失败');
    } finally {
      setUpdatingReadState(false);
    }
  };

  const normalizedTranslationStatus = normalizeTranslationStatus(article?.translationStatus);
  const translatedCount = useMemo(() => getTranslatedCount(article?.translatedText), [article?.translatedText]);

  const translationButtonLabel = useMemo(() => {
    if (translating || normalizedTranslationStatus === 'processing') {
      if (translationProgress?.total) {
        return `翻译中... ${translationProgress.completed}/${translationProgress.total}`;
      }
      return '翻译中...';
    }

    if (normalizedTranslationStatus === 'ready') {
      return '翻译已完成';
    }

    if (translatedCount > 0) {
      return '继续翻译';
    }

    if (normalizedTranslationStatus === 'failed') {
      return '重试翻译';
    }

    return '开始翻译';
  }, [normalizedTranslationStatus, translatedCount, translating, translationProgress]);

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
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
            ← 返回首页
          </Link>
          <ThemeToggle />
        </div>
        <div className="surface-card border-[color:color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] p-4">
          <p className="text-sm text-[color:var(--danger)]">{error || '文章不存在'}</p>
        </div>
      </div>
    );
  }

  if (article.status !== 'ready') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
            ← 返回首页
          </Link>
          <ThemeToggle />
        </div>
        <div className="surface-card p-5">
          <h1 className="mb-4 text-xl font-semibold text-[color:var(--foreground)]">
            {article.title || '处理中...'}
          </h1>
          <div className="flex items-center">
            {article.status === 'processing' && (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-[color:var(--accent)] border-r-transparent" />
                <p className="text-sm text-[color:var(--accent)]">正在后台抓取和生成摘要...</p>
              </>
            )}
            {article.status === 'pending' && (
              <p className="text-sm text-[color:var(--foreground-secondary)]">文章等待后台抓取</p>
            )}
            {article.status === 'failed' && (
              <div className="w-full">
                <p className="mb-3 text-sm text-[color:var(--danger)]">文章抓取失败</p>
                <button
                  type="button"
                  onClick={handleRetryFetch}
                  disabled={retryingFetch}
                  className="btn-primary px-4 text-sm"
                >
                  {retryingFetch ? '重试中...' : '重新抓取并生成摘要'}
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
          ← 返回首页
        </Link>
        <ThemeToggle />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="p-4">
          <ArticleHeader
            title={article.title}
            originalUrl={article.originalUrl}
            createdAt={article.createdAt}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--background-muted)] px-2 py-1 text-xs font-medium text-[color:var(--foreground-secondary)]">
              {article.ownerTag}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-xs font-medium ${
                article.isRead
                  ? 'border-[color:color-mix(in_srgb,var(--success)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_14%,var(--background-elevated))] text-[color:var(--success)]'
                  : 'border-[color:color-mix(in_srgb,var(--warning)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_14%,var(--background-elevated))] text-[color:var(--warning)]'
              }`}
            >
              {article.isRead ? '已读' : '未读'}
            </span>
            <button
              type="button"
              onClick={handleToggleRead}
              disabled={updatingReadState}
              className="btn-secondary min-h-8 px-3 text-xs"
            >
              {updatingReadState ? '更新中...' : article.isRead ? '标记未读' : '标记已读'}
            </button>
          </div>

          {article.summary && (
            <div className="mt-5">
              <ArticleSummary summary={article.summary} />
            </div>
          )}

          {summaryFailed && (
            <div className="mt-5 rounded-xl border border-[color:color-mix(in_srgb,var(--warning)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_12%,var(--background-elevated))] p-4">
              <p className="text-sm text-[color:var(--warning)]">摘要生成失败，可重试抓取。</p>
              <button
                type="button"
                onClick={handleRetryFetch}
                disabled={retryingFetch}
                className="btn-primary mt-3 px-4 text-sm"
              >
                {retryingFetch ? '重试中...' : '重新抓取并生成摘要'}
              </button>
              {retryError && (
                <p className="mt-2 text-sm text-[color:var(--danger)]">{retryError}</p>
              )}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--background-muted)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">翻译</p>
                <p className="text-xs text-[color:var(--foreground-secondary)]">
                  {normalizedTranslationStatus === 'ready'
                    ? `翻译完成，已生成 ${translatedCount} 段`
                    : translatedCount > 0
                      ? `已翻译 ${translatedCount} 段，可继续`
                      : '点击后开始翻译（按段实时显示）'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartTranslation}
                disabled={translating || normalizedTranslationStatus === 'processing' || normalizedTranslationStatus === 'ready'}
                className="btn-primary px-4 text-sm"
              >
                {translationButtonLabel}
              </button>
            </div>
            {(translationError || article.translationError) && normalizedTranslationStatus !== 'ready' && (
              <p className="mt-3 text-sm text-[color:var(--danger)]">{translationError || article.translationError}</p>
            )}
          </div>

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

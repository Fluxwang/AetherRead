'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/app/components/ThemeToggle';

const OWNER_TAGS = ['Wang', 'LYY'] as const;
type OwnerTag = (typeof OWNER_TAGS)[number];
type ReadFilter = 'all' | 'read' | 'unread';

interface Article {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  originalUrl?: string;
  ownerTag: OwnerTag;
  isRead: boolean;
  readAt?: string | null;
}

const readFilterLabels: Record<ReadFilter, string> = {
  all: '全部',
  unread: '未读',
  read: '已读',
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerTag>('Wang');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [updatingArticleId, setUpdatingArticleId] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('ownerTag', ownerFilter);
      params.set('read', readFilter);

      const response = await fetch(`/api/articles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [ownerFilter, readFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const getStatusBadge = (status: Article['status']) => {
    const styles = {
      pending: 'status-badge-pending',
      processing: 'status-badge-processing',
      ready: 'status-badge-ready',
      failed: 'status-badge-failed',
    };
    return (
      <span className={`status-badge ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const toggleReadStatus = async (articleId: string, currentStatus: boolean) => {
    try {
      setUpdatingArticleId(articleId);
      const response = await fetch(`/api/articles/${articleId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '更新已读状态失败');
      }

      const data = await response.json();
      const updated = data.article as { id: string; isRead: boolean; readAt: string | null };

      setArticles((prev) =>
        prev.map((article) =>
          article.id === updated.id
            ? { ...article, isRead: updated.isRead, readAt: updated.readAt }
            : article
        )
      );

      if (readFilter !== 'all') {
        setArticles((prev) =>
          prev.filter((article) => (readFilter === 'read' ? article.isRead : !article.isRead))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新已读状态失败');
    } finally {
      setUpdatingArticleId(null);
    }
  };

  const emptyMessage = useMemo(() => {
    if (readFilter === 'read') return `${ownerFilter} 还没有已读文章`;
    if (readFilter === 'unread') return `${ownerFilter} 还没有未读文章`;
    return `${ownerFilter} 还没有文章`;
  }, [ownerFilter, readFilter]);

  return (
    <div className="space-y-5 pb-2">
      <header className="surface-card px-4 py-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--foreground-tertiary)]">
          Aether Read
        </p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold leading-tight text-[color:var(--foreground)]">
              我的文章
            </h1>
            <p className="mt-1 text-sm text-[color:var(--foreground-secondary)]">
              按用户与阅读状态管理文章。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link href="/add" className="btn-primary min-h-9 px-4 text-sm">
              添加
            </Link>
          </div>
        </div>
      </header>

      <div className="surface-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[color:var(--foreground-tertiary)]">
            用户
          </p>
          <div className="flex flex-wrap gap-2">
            {OWNER_TAGS.map((owner) => {
              const active = owner === ownerFilter;
              return (
                <button
                  key={owner}
                  type="button"
                  onClick={() => setOwnerFilter(owner)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_14%,var(--background-elevated))] text-[color:var(--accent)]'
                      : 'border-[color:var(--border)] bg-[color:var(--background-elevated)] text-[color:var(--foreground-secondary)]'
                  }`}
                >
                  {owner}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[color:var(--foreground-tertiary)]">
            状态
          </p>
          <button
            type="button"
            onClick={() => {
              const filters: ReadFilter[] = ['all', 'unread', 'read'];
              const currentIndex = filters.indexOf(readFilter);
              const nextIndex = (currentIndex + 1) % filters.length;
              setReadFilter(filters[nextIndex]);
            }}
            title={`当前状态: ${readFilterLabels[readFilter]} (点击切换)`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
              readFilter === 'all'
                ? 'border-[color:var(--border)] bg-[color:var(--background-muted)]'
                : readFilter === 'read'
                  ? 'border-[color:color-mix(in_srgb,var(--success)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_14%,var(--background-elevated))]'
                  : 'border-[color:color-mix(in_srgb,var(--warning)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_14%,var(--background-elevated))]'
            }`}
          >
            {readFilter === 'all' && <div className="h-3 w-3 rounded-full bg-[color:var(--foreground-tertiary)]" />}
            {readFilter === 'read' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4 text-[color:var(--success)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {readFilter === 'unread' && <div className="h-3 w-3 rounded-full bg-[color:var(--warning)]" />}
          </button>
        </div>
      </div>

      {loading && (
        <div className="surface-card py-10 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-solid border-[color:var(--accent)] border-r-transparent" />
          <p className="mt-3 text-sm text-[color:var(--foreground-secondary)]">加载中...</p>
        </div>
      )}

      {error && (
        <div className="surface-card border-[color:color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] p-4">
          <p className="text-sm text-[color:var(--danger)]">{error}</p>
        </div>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="surface-card py-10 text-center">
          <p className="text-lg text-[color:var(--foreground-secondary)]">{emptyMessage}</p>
          <Link href="/add" className="btn-primary mt-4 px-5 text-sm">
            添加文章
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {articles.map((article) => (
          <article key={article.id} className="surface-card p-4 flex items-center gap-4">
            <Link href={`/article/${article.id}`} className="block flex-1 min-w-0">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h2 className="line-clamp-2 flex-1 text-base font-semibold text-[color:var(--foreground)]">
                  {article.title || '无标题'}
                </h2>
                {getStatusBadge(article.status)}
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
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
              </div>

              {article.originalUrl && (
                <p className="mb-2 truncate text-xs text-[color:var(--foreground-secondary)]">
                  {article.originalUrl}
                </p>
              )}

              <p className="text-xs text-[color:var(--foreground-tertiary)]">
                {new Date(article.createdAt).toLocaleString('zh-CN')}
              </p>
            </Link>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleReadStatus(article.id, article.isRead);
              }}
              disabled={updatingArticleId === article.id}
              title={article.isRead ? '标记为未读' : '标记为已读'}
              className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                updatingArticleId === article.id
                  ? 'cursor-not-allowed opacity-50 border-[color:var(--border)] bg-[color:var(--background-muted)]'
                  : article.isRead
                    ? 'border-[color:var(--success)] bg-[color:var(--success)] text-white'
                    : 'border-[color:var(--border)] bg-transparent hover:border-[color:var(--accent)]'
              }`}
            >
              {article.isRead && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

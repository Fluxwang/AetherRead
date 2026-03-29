'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  createdAt: string;
  originalUrl?: string;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/articles');
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

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
              移动阅读、翻译与摘要，一页完成。
            </p>
          </div>
          <Link href="/add" className="btn-primary shrink-0 px-4 text-sm">
            添加
          </Link>
        </div>
      </header>

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
          <p className="text-lg text-[color:var(--foreground-secondary)]">还没有文章</p>
          <Link href="/add" className="btn-primary mt-4 px-5 text-sm">
            添加第一篇文章
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/article/${article.id}`}
            className="surface-card block p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <h2 className="line-clamp-2 flex-1 text-base font-semibold text-[color:var(--foreground)]">
                {article.title || '无标题'}
              </h2>
              {getStatusBadge(article.status)}
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
        ))}
      </div>
    </div>
  );
}

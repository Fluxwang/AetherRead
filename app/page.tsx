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
      pending: 'bg-gray-500 text-white',
      processing: 'bg-yellow-500 text-black',
      ready: 'bg-green-500 text-white',
      failed: 'bg-red-500 text-white',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            我的文章
          </h1>
          <Link
            href="/add"
            className="flex items-center justify-center h-11 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            添加文章
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">加载中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
              还没有文章
            </p>
            <Link
              href="/add"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              添加第一篇文章
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="block bg-white dark:bg-zinc-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2 flex-1">
                  {article.title || '无标题'}
                </h2>
                {getStatusBadge(article.status)}
              </div>
              {article.originalUrl && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mb-2">
                  {article.originalUrl}
                </p>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {new Date(article.createdAt).toLocaleString('zh-CN')}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

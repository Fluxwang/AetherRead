'use client';

import { useEffect, useState } from 'react';
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

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>('bilingual');

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/articles/${articleId}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      const data = await response.json();
      setArticle(data.article);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← 返回首页
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">{error || '文章不存在'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (article.status !== 'ready') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← 返回首页
          </Link>
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              {article.title || '处理中...'}
            </h1>
            <div className="flex items-center">
              {article.status === 'processing' && (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent mr-3"></div>
                  <p className="text-blue-600 dark:text-blue-400">正在处理文章...</p>
                </>
              )}
              {article.status === 'pending' && (
                <p className="text-zinc-600 dark:text-zinc-400">文章等待处理</p>
              )}
              {article.status === 'failed' && (
                <p className="text-red-600 dark:text-red-400">文章处理失败</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
        >
          ← 返回首页
        </Link>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <ArticleHeader
              title={article.title}
              originalUrl={article.originalUrl}
              createdAt={article.createdAt}
            />

            {article.summary && (
              <div className="mt-6">
                <ArticleSummary summary={article.summary} />
              </div>
            )}

            <div className="mt-6 border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <ReadingModeToggle
                currentMode={mode}
                onModeChange={setMode}
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700">
            <ArticleContent
              originalContent={article.originalContent || ''}
              translatedText={article.translatedText || ''}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

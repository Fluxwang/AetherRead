'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type InputMode = 'crawler' | 'paste' | 'rss';

export default function AddArticle() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<InputMode>('crawler');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, string> = {
        sourceType: inputMode === 'paste' ? 'manual' : inputMode,
      };

      if (inputMode === 'paste') {
        payload.content = input.trim();
      } else {
        payload.url = input.trim();
      }

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add article');
      }

      const data = await response.json();
      const articleId = data.article.id;
      
      setPolling(true);
      
      // 触发后台处理，不等待完成
      fetch(`/api/articles/process/${articleId}`, { method: 'POST' }).catch(console.error);
      
      await pollArticleStatus(articleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add article');
      setLoading(false);
    }
  };

  const pollArticleStatus = async (articleId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) throw new Error('Failed to fetch article status');
        
        const data = await response.json();
        const article = data.article;
        
        if (article.status === 'ready') {
          router.push(`/article/${articleId}`);
          return;
        }
        
        if (article.status === 'failed') {
          setError('文章处理失败，请重试');
          setLoading(false);
          setPolling(false);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setError('处理超时，请稍后查看');
          setLoading(false);
          setPolling(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check status');
        setLoading(false);
        setPolling(false);
      }
    };

    poll();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            添加文章
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-3">
              选择模式
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="crawler"
                  checked={inputMode === 'crawler'}
                  onChange={(e) => setInputMode(e.target.value as InputMode)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    爬虫模式
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    输入文章URL，自动抓取内容
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="paste"
                  checked={inputMode === 'paste'}
                  onChange={(e) => setInputMode(e.target.value as InputMode)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    直接粘贴
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    粘贴文章内容（支持 Markdown）
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="rss"
                  checked={inputMode === 'rss'}
                  onChange={(e) => setInputMode(e.target.value as InputMode)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    RSS订阅
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    输入RSS源URL
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="input" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
              {inputMode === 'crawler' && 'URL'}
              {inputMode === 'paste' && '文章内容'}
              {inputMode === 'rss' && 'RSS URL'}
            </label>
            {inputMode === 'paste' ? (
              <textarea
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="粘贴文章内容（支持 Markdown）..."
                required
                disabled={loading}
              />
            ) : (
              <input
                id="input"
                type="url"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={inputMode === 'crawler' ? 'https://example.com/article' : 'https://example.com/feed.xml'}
                required
                disabled={loading}
              />
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {polling && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent mr-3"></div>
                <p className="text-blue-600 dark:text-blue-400">正在处理文章，请稍候...</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full h-12 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : '提交'}
          </button>
        </form>
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
      <div>
        <Link href="/" className="inline-flex items-center text-sm text-[color:var(--accent)]">
          ← 返回首页
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
          添加文章
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="surface-card p-4">
        <div className="mb-5">
          <label className="mb-3 block text-sm font-medium text-[color:var(--foreground)]">
              选择模式
          </label>
          <div className="space-y-2">
            <label className="surface-muted flex cursor-pointer items-center p-3 transition-colors">
              <input
                type="radio"
                name="mode"
                value="crawler"
                checked={inputMode === 'crawler'}
                onChange={(e) => setInputMode(e.target.value as InputMode)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-[color:var(--foreground)]">
                  爬虫模式
                </div>
                <div className="text-xs text-[color:var(--foreground-secondary)]">
                  输入文章URL，自动抓取内容
                </div>
              </div>
            </label>

            <label className="surface-muted flex cursor-pointer items-center p-3 transition-colors">
              <input
                type="radio"
                name="mode"
                value="paste"
                checked={inputMode === 'paste'}
                onChange={(e) => setInputMode(e.target.value as InputMode)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-[color:var(--foreground)]">
                  直接粘贴
                </div>
                <div className="text-xs text-[color:var(--foreground-secondary)]">
                  粘贴文章内容（支持 Markdown）
                </div>
              </div>
            </label>

            <label className="surface-muted flex cursor-pointer items-center p-3 transition-colors">
              <input
                type="radio"
                name="mode"
                value="rss"
                checked={inputMode === 'rss'}
                onChange={(e) => setInputMode(e.target.value as InputMode)}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-[color:var(--foreground)]">
                  RSS订阅
                </div>
                <div className="text-xs text-[color:var(--foreground-secondary)]">
                  输入RSS源URL
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="input" className="mb-2 block text-sm font-medium text-[color:var(--foreground)]">
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
              className="focus-ring w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-[color:var(--foreground)]"
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
              className="focus-ring w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background-elevated)] px-4 py-3 text-[color:var(--foreground)]"
              placeholder={inputMode === 'crawler' ? 'https://example.com/article' : 'https://example.com/feed.xml'}
              required
              disabled={loading}
            />
          )}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-[color:color-mix(in_srgb,var(--danger)_45%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] p-3">
            <p className="text-sm text-[color:var(--danger)]">{error}</p>
          </div>
        )}

        {polling && (
          <div className="mb-5 rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--background-elevated))] p-3">
            <div className="flex items-center">
              <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-[color:var(--accent)] border-r-transparent" />
              <p className="text-sm text-[color:var(--accent)]">正在处理文章，请稍候...</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary w-full"
        >
          {loading ? '处理中...' : '提交'}
        </button>
      </form>
    </div>
  );
}

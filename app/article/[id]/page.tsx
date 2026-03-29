"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ArticleHeader from "@/app/components/ArticleHeader";
import ReadingModeToggle from "@/app/components/ReadingModeToggle";
import ArticleContent from "@/app/components/ArticleContent";
import ThemeToggle from "@/app/components/ThemeToggle";
import type { Article, OwnerTag, ReadingMode, TranslationStatus } from "@/types";
import { OWNER_TAGS } from "@/types";

function normalizeTranslationStatus(value?: string): TranslationStatus {
  if (value === "processing" || value === "ready" || value === "failed") {
    return value;
  }
  return "not_started";
}

function getTranslatedCount(translatedText?: string | null): number {
  if (!translatedText?.trim()) {
    return 0;
  }

  try {
    const parsed = JSON.parse(translatedText);
    if (!Array.isArray(parsed)) {
      return 0;
    }

    return parsed.filter(
      (item) => typeof item?.zh === "string" && item.zh.trim().length > 0,
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
  const [mode, setMode] = useState<ReadingMode>("english");
  const [retryingFetch, setRetryingFetch] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [updatingOwnerTag, setUpdatingOwnerTag] = useState(false);
  const [ownerTagError, setOwnerTagError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const translationSourceRef = useRef<EventSource | null>(null);

  const closeTranslationSource = useCallback(() => {
    if (translationSourceRef.current) {
      translationSourceRef.current.close();
      translationSourceRef.current = null;
    }
  }, []);

  const fetchArticle = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        const response = await fetch(`/api/articles/${articleId}`);
        if (!response.ok) throw new Error("Failed to fetch article");
        const data = await response.json();
        const fetchedArticle = data.article as Article;

        setArticle({
          ...fetchedArticle,
          translationStatus: normalizeTranslationStatus(
            fetchedArticle.translationStatus,
          ),
          translationError: fetchedArticle.translationError || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load article");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [articleId],
  );

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  useEffect(() => {
    return () => {
      closeTranslationSource();
    };
  }, [closeTranslationSource]);

  useEffect(() => {
    if (
      !article ||
      (article.status !== "processing" && article.status !== "pending")
    ) {
      return;
    }

    const timer = setInterval(() => {
      fetchArticle({ silent: true });
    }, 2000);

    return () => clearInterval(timer);
  }, [article, fetchArticle]);

  useEffect(() => {
    if (!article || article.status !== "ready" || article.isRead) {
      return;
    }

    let cancelled = false;
    const markAsRead = async () => {
      try {
        const response = await fetch(`/api/articles/${article.id}/read`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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
            : prev,
        );
      } catch (markError) {
        console.error("Error auto marking article as read:", markError);
      }
    };

    void markAsRead();
    return () => {
      cancelled = true;
    };
  }, [article]);

  const handleRetryFetch = async () => {
    if (!article) return;

    try {
      setRetryingFetch(true);
      setRetryError(null);
      setError(null);

      const response = await fetch(`/api/articles/fetch/${article.id}`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "重试抓取失败");
      }

      await fetchArticle({ silent: true });
    } catch (err) {
      setRetryError(
        err instanceof Error ? err.message : "重试抓取失败，请稍后再试",
      );
    } finally {
      setRetryingFetch(false);
    }
  };

  const handleStartTranslation = () => {
    if (!article || article.status !== "ready") {
      return;
    }

    closeTranslationSource();
    setTranslationError(null);
    setTranslationProgress(null);
    setTranslating(true);

    const source = new EventSource(
      `/api/articles/translate/${article.id}/stream`,
    );
    translationSourceRef.current = source;

    const closeCurrentSource = () => {
      source.close();
      if (translationSourceRef.current === source) {
        translationSourceRef.current = null;
      }
    };

    source.addEventListener("start", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        total: number;
        completed: number;
      };
      setTranslationProgress({ completed: data.completed, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: "processing",
              translationError: null,
            }
          : prev,
      );
    });

    source.addEventListener("chunk", (event) => {
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
              translationStatus: "processing",
              translationError: null,
            }
          : prev,
      );
    });

    source.addEventListener("done", (event) => {
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
              translationStatus: "ready",
              translationError: null,
            }
          : prev,
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.addEventListener("aborted", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        completed: number;
        total: number;
      };

      setTranslationProgress({ completed: data.completed, total: data.total });
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: "not_started",
            }
          : prev,
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.addEventListener("translate_error", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as {
        message?: string;
      };
      const message = data.message || "翻译失败";

      setTranslationError(message);
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: "failed",
              translationError: message,
            }
          : prev,
      );
      setTranslating(false);
      closeCurrentSource();
    });

    source.onerror = () => {
      if (translationSourceRef.current !== source) {
        return;
      }

      setTranslationError("翻译连接中断，请重试");
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              translationStatus: "failed",
              translationError: "翻译连接中断",
            }
          : prev,
      );
      setTranslating(false);
      closeCurrentSource();
    };
  };



  const handleChangeOwnerTag = async (nextOwnerTag: OwnerTag) => {
    if (!article || article.ownerTag === nextOwnerTag) {
      return;
    }

    const previousOwnerTag = article.ownerTag;
    setUpdatingOwnerTag(true);
    setOwnerTagError(null);
    setArticle((prev) =>
      prev
        ? {
            ...prev,
            ownerTag: nextOwnerTag,
          }
        : prev,
    );

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerTag: nextOwnerTag }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "更新用户失败");
      }

      const data = await response.json();
      const updatedOwnerTag = data.article?.ownerTag as OwnerTag | undefined;

      if (updatedOwnerTag === "Wang" || updatedOwnerTag === "LYY") {
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                ownerTag: updatedOwnerTag,
              }
            : prev,
        );
      }
    } catch (err) {
      setArticle((prev) =>
        prev
          ? {
              ...prev,
              ownerTag: previousOwnerTag,
            }
          : prev,
      );
      setOwnerTagError(err instanceof Error ? err.message : "更新用户失败");
    } finally {
      setUpdatingOwnerTag(false);
    }
  };

  const normalizedTranslationStatus = normalizeTranslationStatus(
    article?.translationStatus,
  );
  const translatedCount = useMemo(
    () => getTranslatedCount(article?.translatedText),
    [article?.translatedText],
  );

  const translationButtonLabel = useMemo(() => {
    if (translating || normalizedTranslationStatus === "processing") {
      if (translationProgress?.total) {
        return `翻译中... ${translationProgress.completed}/${translationProgress.total}`;
      }
      return "翻译中...";
    }

    if (normalizedTranslationStatus === "ready") {
      return "翻译已完成";
    }

    if (translatedCount > 0) {
      return "继续翻译";
    }

    if (normalizedTranslationStatus === "failed") {
      return "重试翻译";
    }

    return "开始翻译";
  }, [
    normalizedTranslationStatus,
    translatedCount,
    translating,
    translationProgress,
  ]);

  if (loading) {
    return (
      <div className="surface-card flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[color:var(--accent)] border-r-transparent" />
          <p className="mt-3 text-sm text-[color:var(--foreground-secondary)]">
            加载中...
          </p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-[color:var(--accent)]"
          >
            ← 返回首页
          </Link>
          <ThemeToggle />
        </div>
        <div className="surface-card border-[color:color-mix(in_srgb,var(--danger)_40%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] p-4">
          <p className="text-sm text-[color:var(--danger)]">
            {error || "文章不存在"}
          </p>
        </div>
      </div>
    );
  }

  if (article.status !== "ready") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-[color:var(--accent)]"
          >
            ← 返回首页
          </Link>
          <ThemeToggle />
        </div>
        <div className="surface-card p-5">
          <h1 className="mb-4 text-xl font-semibold text-[color:var(--foreground)]">
            {article.title || "处理中..."}
          </h1>
          <div className="flex items-center">
            {article.status === "processing" && (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-solid border-[color:var(--accent)] border-r-transparent" />
                <p className="text-sm text-[color:var(--accent)]">
                  正在后台抓取和生成摘要...
                </p>
              </>
            )}
            {article.status === "pending" && (
              <p className="text-sm text-[color:var(--foreground-secondary)]">
                文章等待后台抓取
              </p>
            )}
            {article.status === "failed" && (
              <div className="w-full">
                <p className="mb-3 text-sm text-[color:var(--danger)]">
                  文章抓取失败
                </p>
                <button
                  type="button"
                  onClick={handleRetryFetch}
                  disabled={retryingFetch}
                  className="btn-primary px-4 text-sm"
                >
                  {retryingFetch ? "重试中..." : "重新抓取并生成摘要"}
                </button>
              </div>
            )}
          </div>
          {retryError && (
            <p className="mt-3 text-sm text-[color:var(--danger)]">
              {retryError}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[color:var(--accent)]"
        >
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
            <div className="relative inline-flex items-center">
              <span className="sr-only">选择文章归属用户</span>
              <div className="absolute left-2.5 z-10 flex items-center pointer-events-none">
                {updatingOwnerTag ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-solid border-[color:var(--accent)] border-r-transparent" />
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3 text-[color:var(--foreground-tertiary)]"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <select
                value={article.ownerTag}
                onChange={(event) =>
                  void handleChangeOwnerTag(event.target.value as OwnerTag)
                }
                disabled={updatingOwnerTag}
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--background-muted)] pl-7 pr-7 py-1 text-xs font-semibold text-[color:var(--foreground-secondary)] appearance-none cursor-pointer transition-all hover:border-[color:var(--border-strong)] hover:bg-[color:color-mix(in_srgb,var(--background-muted)_80%,var(--border))] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--accent)_25%,transparent)] disabled:cursor-wait"
                title="切换文章归属用户"
              >
                {OWNER_TAGS.map((ownerTag) => (
                  <option key={ownerTag} value={ownerTag}>
                    {ownerTag}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-[color:var(--foreground-tertiary)]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-2.5 w-2.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                article.isRead
                  ? "border-[color:color-mix(in_srgb,var(--success)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_14%,var(--background-elevated))] text-[color:var(--success)]"
                  : "border-[color:color-mix(in_srgb,var(--warning)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--warning)_14%,var(--background-elevated))] text-[color:var(--warning)]"
              }`}
            >
              {article.isRead ? "已读" : "未读"}
            </span>

            <button
              type="button"
              onClick={handleStartTranslation}
              disabled={
                translating ||
                normalizedTranslationStatus === "processing" ||
                normalizedTranslationStatus === "ready"
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                normalizedTranslationStatus === "ready"
                  ? "border-[color:color-mix(in_srgb,var(--success)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--success)_10%,var(--background-elevated))] text-[color:var(--success)]"
                  : normalizedTranslationStatus === "failed"
                    ? "border-[color:color-mix(in_srgb,var(--danger)_55%,var(--border))] bg-[color:color-mix(in_srgb,var(--danger)_10%,var(--background-elevated))] text-[color:var(--danger)]"
                    : "border-[color:var(--border)] bg-[color:var(--background-muted)] text-[color:var(--foreground-secondary)] hover:border-[color:var(--border-strong)] hover:bg-[color:color-mix(in_srgb,var(--background-muted)_80%,var(--border))]"
              } disabled:cursor-default`}
              title={translationButtonLabel}
            >
              {translating || normalizedTranslationStatus === "processing" ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                  <span>
                    {translationProgress
                      ? `${translationProgress.completed}/${translationProgress.total}`
                      : "翻译中"}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="m5 8 6 6" />
                    <path d="m4 14 6-6 2-3" />
                    <path d="M2 5h12" />
                    <path d="M7 2h1" />
                    <path d="m22 22-5-10-5 10" />
                    <path d="M14 18h6" />
                  </svg>
                  <span>
                    {normalizedTranslationStatus === "ready"
                      ? "已翻译"
                      : translatedCount > 0
                        ? "继续翻译"
                        : "翻译"}
                  </span>
                </>
              )}
            </button>
          </div>
          {ownerTagError && (
            <p className="mt-2 text-sm text-[color:var(--danger)]">
              {ownerTagError}
            </p>
          )}
          {(translationError || article.translationError) &&
            normalizedTranslationStatus !== "ready" && (
              <p className="mt-2 text-xs text-[color:var(--danger)]">
                {translationError || article.translationError}
              </p>
            )}

          <div className="mt-5 border-t border-[color:var(--border)] pt-5">
            <ReadingModeToggle currentMode={mode} onModeChange={setMode} />
          </div>
        </div>

        <div className="border-t border-[color:var(--border)]">
          <ArticleContent
            originalContent={article.originalContent || ""}
            translatedText={article.translatedText || ""}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}

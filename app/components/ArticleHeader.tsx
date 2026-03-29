'use client';

interface ArticleHeaderProps {
  title: string;
  originalUrl?: string | null;
  createdAt: string | Date;
}

export default function ArticleHeader({ title, originalUrl, createdAt }: ArticleHeaderProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold leading-tight text-[color:var(--foreground)]">
        {title}
      </h1>

      <div className="flex flex-col gap-2 text-sm text-[color:var(--foreground-secondary)]">
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[color:var(--accent)] hover:underline"
          >
            {originalUrl}
          </a>
        )}

        <div className="text-xs text-[color:var(--foreground-tertiary)]">
          {new Date(createdAt).toLocaleString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

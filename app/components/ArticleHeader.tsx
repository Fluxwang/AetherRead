'use client';

interface ArticleHeaderProps {
  title: string;
  originalUrl?: string;
  createdAt: string;
}

export default function ArticleHeader({ title, originalUrl, createdAt }: ArticleHeaderProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
        {title}
      </h1>
      
      <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
          >
            {originalUrl}
          </a>
        )}
        
        <div className="text-xs text-zinc-500 dark:text-zinc-500">
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

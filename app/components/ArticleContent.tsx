'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ReadingMode = 'english' | 'bilingual' | 'chinese';

interface Translation {
  en: string;
  zh: string;
}

interface ArticleContentProps {
  originalContent: string;
  translatedText: string;
  mode: ReadingMode;
}

function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`article-markdown text-[17px] leading-[1.8] ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ArticleContent({ originalContent, translatedText, mode }: ArticleContentProps) {
  const translations = useMemo<Translation[]>(() => {
    if (!translatedText) {
      return [];
    }

    try {
      const parsed = JSON.parse(translatedText);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is Translation =>
          typeof item?.en === 'string' &&
          typeof item?.zh === 'string'
      );
    } catch (error) {
      console.error('Failed to parse translated text:', error);
      return [];
    }
  }, [translatedText]);

  const renderEnglishOnly = () => {
    return (
      <div className="max-w-none">
        <MarkdownRenderer
          content={originalContent}
          className="text-[color:var(--foreground)]"
        />
      </div>
    );
  };

  const renderChineseOnly = () => {
    if (translations.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-[color:var(--foreground-secondary)]">
          暂无中文翻译
        </div>
      );
    }

    const chineseContent = translations
      .map((item) => item.zh.trim())
      .filter(Boolean)
      .join('\n\n');

    if (!chineseContent) {
      return (
        <div className="py-8 text-center text-sm text-[color:var(--foreground-secondary)]">
          暂无中文翻译
        </div>
      );
    }

    return (
      <div className="max-w-none">
        <MarkdownRenderer
          content={chineseContent}
          className="text-[color:var(--foreground)]"
        />
      </div>
    );
  };

  const renderBilingual = () => {
    if (translations.length === 0) {
      return renderEnglishOnly();
    }

    const validPairs = translations.filter(
      (item) => item.en.trim().length > 0 || item.zh.trim().length > 0
    );

    if (validPairs.length === 0) {
      return renderEnglishOnly();
    }

    return (
      <div className="max-w-none">
        {validPairs.map((item, index) => (
          <div key={index} className="mb-7">
            <MarkdownRenderer
              content={item.en}
              className="mb-3 text-[color:var(--foreground)]"
            />
            <MarkdownRenderer
              content={item.zh}
              className="border-l-4 border-[color:color-mix(in_srgb,var(--accent)_35%,var(--border))] pl-4 text-[color:var(--foreground-secondary)]"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-4 py-6">
      {mode === 'english' && renderEnglishOnly()}
      {mode === 'chinese' && renderChineseOnly()}
      {mode === 'bilingual' && renderBilingual()}
    </div>
  );
}

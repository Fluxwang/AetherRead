'use client';

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

export default function ArticleContent({ originalContent, translatedText, mode }: ArticleContentProps) {
  let translations: Translation[] = [];
  
  try {
    if (translatedText) {
      translations = JSON.parse(translatedText);
    }
  } catch (error) {
    console.error('Failed to parse translated text:', error);
  }

  const renderEnglishOnly = () => {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-[18px] leading-[1.8] text-zinc-900 dark:text-zinc-50">
          {originalContent}
        </div>
      </div>
    );
  };

  const renderChineseOnly = () => {
    if (translations.length === 0) {
      return (
        <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
          暂无中文翻译
        </div>
      );
    }

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {translations.map((item, index) => (
          <p
            key={index}
            className="text-[18px] leading-[1.8] text-zinc-900 dark:text-zinc-50 mb-6"
          >
            {item.zh}
          </p>
        ))}
      </div>
    );
  };

  const renderBilingual = () => {
    if (translations.length === 0) {
      return renderEnglishOnly();
    }

    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {translations.map((item, index) => (
          <div key={index} className="mb-8">
            <p className="text-[18px] leading-[1.8] text-zinc-900 dark:text-zinc-50 mb-3">
              {item.en}
            </p>
            <p className="text-[18px] leading-[1.8] text-zinc-600 dark:text-zinc-400 pl-4 border-l-4 border-blue-200 dark:border-blue-800">
              {item.zh}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="px-6 py-8">
      {mode === 'english' && renderEnglishOnly()}
      {mode === 'chinese' && renderChineseOnly()}
      {mode === 'bilingual' && renderBilingual()}
    </div>
  );
}

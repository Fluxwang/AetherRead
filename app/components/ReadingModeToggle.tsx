'use client';

type ReadingMode = 'english' | 'bilingual' | 'chinese';

interface ReadingModeToggleProps {
  currentMode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
}

export default function ReadingModeToggle({ currentMode, onModeChange }: ReadingModeToggleProps) {
  const modes: { value: ReadingMode; label: string }[] = [
    { value: 'english', label: '全英文' },
    { value: 'bilingual', label: '双语' },
    { value: 'chinese', label: '全中文' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        阅读模式
      </label>
      <div className="flex gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors ${
              currentMode === mode.value
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

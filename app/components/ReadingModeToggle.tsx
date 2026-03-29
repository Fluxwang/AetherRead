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
      <label className="text-sm font-medium text-[color:var(--foreground)]">
        阅读模式
      </label>
      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onModeChange(mode.value)}
            className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              currentMode === mode.value
                ? 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]'
                : 'surface-muted text-[color:var(--foreground-secondary)] hover:bg-[color:var(--background-muted)]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface ArticleSummaryProps {
  summary: string;
}

export default function ArticleSummary({ summary }: ArticleSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-[color:color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--background-elevated))]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_14%,var(--background-elevated))]"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[color:var(--accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-[color:var(--accent)]">AI 摘要</span>
        </div>
        <svg
          className={`h-5 w-5 text-[color:var(--accent)] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[color:color-mix(in_srgb,var(--accent)_30%,var(--border))] px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--foreground-secondary)]">
            {summary}
          </p>
        </div>
      )}
    </div>
  );
}

// Types for the application
export interface Article {
  id: string;
  title: string;
  originalUrl: string | null;
  sourceType: string;
  originalContent: string;
  summary: string | null;
  translatedText: string | null;
  status: "pending" | "processing" | "ready" | "failed";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BilingualParagraph {
  en: string;
  zh: string;
}

export type ReadingMode = "english" | "bilingual" | "chinese";

export type SourceType = "crawler" | "manual" | "rss";

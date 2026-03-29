// Types for the application
import { OWNER_TAGS } from '@/lib/constants';

// Re-export constants
export { OWNER_TAGS };

// User and Filters
export type OwnerTag = (typeof OWNER_TAGS)[number];
export type ReadFilter = "all" | "read" | "unread";

// Content Types
export type ReadingMode = "english" | "bilingual" | "chinese";
export type SourceType = "crawler" | "manual" | "rss";
export type InputMode = "crawler" | "paste" | "rss";

// Status Types
export type ArticleStatus = "pending" | "processing" | "ready" | "failed";
export type TranslationStatus = "not_started" | "processing" | "ready" | "failed";

// Main Article Interface
export interface Article {
  id: string;
  title: string;
  originalUrl: string | null;
  sourceType: string;
  ownerTag: OwnerTag;
  isRead: boolean;
  readAt: Date | string | null;
  originalContent: string;
  summary: string | null;
  translatedText: string | null;
  translationStatus: TranslationStatus;
  translationError: string | null;
  status: ArticleStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Translation
export interface BilingualParagraph {
  en: string;
  zh: string;
}


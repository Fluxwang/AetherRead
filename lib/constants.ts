/**
 * Application Constants
 * 
 * Centralized constants used across the application.
 * Import constants from this file instead of redefining them.
 */

// User Tags
export const OWNER_TAGS = ["Wang", "LYY"] as const;

// Status Labels (Chinese)
export const STATUS_LABELS: Record<string, string> = {
  pending: "等待中",
  processing: "处理中",
  ready: "已就绪",
  failed: "失败",
};

export const TRANSLATION_STATUS_LABELS: Record<string, string> = {
  not_started: "未开始",
  processing: "翻译中",
  ready: "已完成",
  failed: "失败",
};

// Read Filter Labels
export const READ_FILTER_LABELS: Record<string, string> = {
  all: "全部",
  unread: "未读",
  read: "已读",
};

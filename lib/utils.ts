// Utility function to merge Tailwind classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Format date to Chinese locale
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case "ready":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "processing":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "pending":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
}

// Get status text in Chinese
export function getStatusText(status: string): string {
  switch (status) {
    case "ready":
      return "已就绪";
    case "processing":
      return "处理中";
    case "failed":
      return "失败";
    case "pending":
      return "等待中";
    default:
      return status;
  }
}

/**
 * Format timestamp into user-friendly relative time (e.g. "5m ago", "2h ago", "Yesterday")
 */
export const formatRelativeTime = (isoString: string | null): string => {
  if (!isoString) return 'a long time ago';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  
  return date.toLocaleDateString();
};

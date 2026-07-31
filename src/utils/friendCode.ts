import type { OnlineStatus } from '../types';

/**
 * Format timestamp into user-friendly relative time (e.g. "5m ago", "2h ago", "Yesterday")
 */
export const formatRelativeTime = (isoString: string | null | undefined): string => {
  if (!isoString) return 'a long time ago';
  
  const date = new Date(isoString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 0) return 'Just now';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  
  return date.toLocaleDateString();
};

/**
 * Calculate real-time effective online status based on status string and lastSeen timestamp.
 * Rules:
 * - If on website & active heartbeat (within 45s) -> 'online'
 * - If playing game & active heartbeat (within 45s) -> 'in-game'
 * - Else (offline, tab closed, stale heartbeat) -> 'offline'
 */
export const getEffectiveStatus = (
  userProfile: { status?: OnlineStatus | string; lastSeen?: string | null } | null | undefined
): OnlineStatus => {
  if (!userProfile) return 'offline';
  if (userProfile.status === 'offline') return 'offline';
  if (!userProfile.lastSeen) return 'offline';

  const lastSeenMs = new Date(userProfile.lastSeen).getTime();
  const nowMs = Date.now();
  
  // If last heartbeat was more than 40 seconds ago, consider offline
  if (isNaN(lastSeenMs) || nowMs - lastSeenMs > 40000) {
    return 'offline';
  }

  return userProfile.status === 'in-game' ? 'in-game' : 'online';
};

/**
 * Generates a unique 10-character uppercase alphanumeric Player ID (e.g. "CW7K9P2X4M").
 * Never changes once assigned to a user profile.
 */
export const generatePlayerId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (0, O, 1, I)
  let code = 'CW';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

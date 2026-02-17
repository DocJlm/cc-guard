/**
 * Format a USD cost value for display.
 */
export function formatCost(usd: number): string {
  if (usd < 0.01) {
    return `$${usd.toFixed(4)}`;
  }
  if (usd < 1) {
    return `$${usd.toFixed(3)}`;
  }
  return `$${usd.toFixed(2)}`;
}

/**
 * Format a token count for display (e.g., 1500 → "1.5K", 1500000 → "1.5M").
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return `${count}`;
}

/**
 * Format a duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format a percentage value.
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format a rate ($/hr).
 */
export function formatRate(usdPerHour: number): string {
  return `${formatCost(usdPerHour)}/hr`;
}

/**
 * Format a token rate (tokens/hr).
 */
export function formatTokenRate(tokensPerHour: number): string {
  return `${formatTokens(tokensPerHour)}/hr`;
}

/**
 * Truncate a string to a max length, adding ellipsis if needed.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/**
 * Format a relative time (e.g., "2m ago", "1h ago").
 */
export function formatTimeAgo(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMinutes > 0) return `${diffMinutes}m ago`;
  return 'just now';
}

/**
 * Abbreviate a Claude model ID for compact display.
 *
 * "claude-opus-4-6"               → "opus-4.6"
 * "claude-sonnet-4-20250514"      → "sonnet-4"
 * "claude-sonnet-4-5-20250929"    → "sonnet-4.5"
 * "claude-3-7-sonnet-20250219"    → "sonnet-3.7"
 * "claude-haiku-4-5-20251001"     → "haiku-4.5"
 * "glm-4.7"                       → "glm-4.7" (pass-through)
 */
export function abbreviateModel(modelId: string): string {
  const lower = modelId.toLowerCase();

  const familyMatch = lower.match(/(opus|sonnet|haiku)/);
  if (!familyMatch) return modelId;

  const family = familyMatch[1];

  // Old format: claude-{major}-{minor?}-{family}-{date}
  const oldFmt = lower.match(new RegExp(`(\\d)(?:-(\\d+))?-${family}`));
  if (oldFmt) {
    const major = oldFmt[1];
    const minor = oldFmt[2];
    return minor ? `${family}-${major}.${minor}` : `${family}-${major}`;
  }

  // New format: claude-{family}-{major}-{minor?}-{date?}
  const newFmt = lower.match(new RegExp(`${family}-(\\d+)(?:-(\\d+))?`));
  if (newFmt) {
    const major = newFmt[1];
    const minor = newFmt[2];
    if (minor && minor.length >= 4) {
      // Date suffix, no minor version
      return `${family}-${major}`;
    }
    return minor ? `${family}-${major}.${minor}` : `${family}-${major}`;
  }

  return modelId;
}

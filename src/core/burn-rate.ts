import type { BillingBlock, BurnRate, TokenBurnRate } from './types.js';

const RECENT_WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const SPARKLINE_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
const SPARKLINE_BUCKETS = 30;                // 30 buckets = 2 min each
const TREND_THRESHOLD = 0.3;                 // 30% difference to trigger trend

/** Get total tokens for an entry */
function entryTotalTokens(entry: { inputTokens: number; outputTokens: number; cacheCreationTokens: number; cacheReadTokens: number }): number {
  return entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens;
}

/**
 * Calculate burn rate statistics from a billing block.
 */
export function calculateBurnRate(block: BillingBlock, now: Date = new Date()): BurnRate {
  const elapsedMs = now.getTime() - block.startTime.getTime();
  const elapsedHours = Math.max(elapsedMs / (1000 * 60 * 60), 0.01); // min 0.01h to avoid division by zero
  const remainingMs = block.endTime.getTime() - now.getTime();
  const remainingHours = Math.max(remainingMs / (1000 * 60 * 60), 0);

  // Overall cost per hour
  const costPerHour = block.totalCost / elapsedHours;

  // Recent cost per hour (last 15 minutes)
  const recentCutoff = now.getTime() - RECENT_WINDOW_MS;
  const recentEntries = block.entries.filter(
    e => new Date(e.timestamp).getTime() >= recentCutoff
  );
  const recentCost = recentEntries.reduce((sum, e) => sum + e.costUSD, 0);
  const recentElapsedHours = Math.min(elapsedHours, RECENT_WINDOW_MS / (1000 * 60 * 60));
  const recentCostPerHour = recentCost / Math.max(recentElapsedHours, 0.01);

  // Projected total
  const projectedBlockTotal = block.totalCost + costPerHour * remainingHours;

  // Trend detection
  let trend: BurnRate['trend'] = 'stable';
  if (block.entries.length >= 3 && elapsedHours > 0.05) {
    const ratio = recentCostPerHour / Math.max(costPerHour, 0.0001);
    if (ratio > 1 + TREND_THRESHOLD) {
      trend = 'rising';
    } else if (ratio < 1 - TREND_THRESHOLD) {
      trend = 'falling';
    }
  }

  // Sparkline data (last 60 minutes, 30 buckets of 2 min each)
  const sparklineData = computeSparkline(block, now, e => e.costUSD);

  return {
    costPerHour,
    recentCostPerHour,
    projectedBlockTotal,
    trend,
    sparklineData,
  };
}

/**
 * Calculate token burn rate from a billing block.
 */
export function calculateTokenBurnRate(block: BillingBlock, now: Date = new Date()): TokenBurnRate {
  const elapsedMs = now.getTime() - block.startTime.getTime();
  const elapsedHours = Math.max(elapsedMs / (1000 * 60 * 60), 0.01);
  const remainingMs = block.endTime.getTime() - now.getTime();
  const remainingHours = Math.max(remainingMs / (1000 * 60 * 60), 0);

  const totalTokens = block.entries.reduce((sum, e) => sum + entryTotalTokens(e), 0);
  const tokensPerHour = totalTokens / elapsedHours;

  // Recent token rate
  const recentCutoff = now.getTime() - RECENT_WINDOW_MS;
  const recentEntries = block.entries.filter(
    e => new Date(e.timestamp).getTime() >= recentCutoff
  );
  const recentTokens = recentEntries.reduce((sum, e) => sum + entryTotalTokens(e), 0);
  const recentElapsedHours = Math.min(elapsedHours, RECENT_WINDOW_MS / (1000 * 60 * 60));
  const recentTokensPerHour = recentTokens / Math.max(recentElapsedHours, 0.01);

  const projectedBlockTokens = totalTokens + tokensPerHour * remainingHours;

  let trend: TokenBurnRate['trend'] = 'stable';
  if (block.entries.length >= 3 && elapsedHours > 0.05) {
    const ratio = recentTokensPerHour / Math.max(tokensPerHour, 1);
    if (ratio > 1 + TREND_THRESHOLD) {
      trend = 'rising';
    } else if (ratio < 1 - TREND_THRESHOLD) {
      trend = 'falling';
    }
  }

  const sparklineData = computeSparkline(block, now, e => entryTotalTokens(e));

  return {
    tokensPerHour,
    recentTokensPerHour,
    projectedBlockTokens,
    trend,
    sparklineData,
  };
}

/**
 * Compute sparkline data: value per bucket over the last hour.
 */
function computeSparkline(
  block: BillingBlock,
  now: Date,
  getValue: (entry: BillingBlock['entries'][0]) => number,
): number[] {
  const bucketSize = SPARKLINE_WINDOW_MS / SPARKLINE_BUCKETS;
  const windowStart = now.getTime() - SPARKLINE_WINDOW_MS;
  const buckets = new Array<number>(SPARKLINE_BUCKETS).fill(0);

  for (const entry of block.entries) {
    const entryTime = new Date(entry.timestamp).getTime();
    if (entryTime < windowStart) continue;
    if (entryTime > now.getTime()) continue;

    const bucketIndex = Math.min(
      Math.floor((entryTime - windowStart) / bucketSize),
      SPARKLINE_BUCKETS - 1
    );
    buckets[bucketIndex] += getValue(entry);
  }

  return buckets;
}

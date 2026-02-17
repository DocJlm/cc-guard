import type { UsageEntry, BillingBlock } from './types.js';

const BLOCK_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours in ms

/**
 * Floor a date to the start of the current UTC hour.
 */
export function floorToHour(date: Date): Date {
  const floored = new Date(date);
  floored.setUTCMinutes(0, 0, 0);
  return floored;
}

/**
 * Compute billing blocks from a sorted list of usage entries.
 *
 * Rules (matching ccusage logic):
 * - Block start time is the first entry's timestamp floored to UTC hour
 * - Block lasts 5 hours from start
 * - If gap between entries > 5h, start a new block
 * - Active block: now is within block window and last activity < 5h ago
 */
export function computeBlocks(entries: UsageEntry[], now: Date = new Date()): BillingBlock[] {
  if (entries.length === 0) return [];

  // Sort by timestamp
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const blocks: BillingBlock[] = [];
  let currentBlock: BillingBlock | null = null;

  for (const entry of sorted) {
    const entryTime = new Date(entry.timestamp);

    if (!currentBlock) {
      // Start first block
      currentBlock = createBlock(entryTime, entry);
      continue;
    }

    const timeSinceBlockStart = entryTime.getTime() - currentBlock.startTime.getTime();
    const lastEntry = currentBlock.entries[currentBlock.entries.length - 1];
    const timeSinceLastEntry = entryTime.getTime() - new Date(lastEntry.timestamp).getTime();

    // Start new block if:
    // 1. Entry is past the block's 5h window, OR
    // 2. Gap between entries > 5h
    if (timeSinceBlockStart >= BLOCK_DURATION_MS || timeSinceLastEntry >= BLOCK_DURATION_MS) {
      currentBlock.isActive = false;
      blocks.push(currentBlock);
      currentBlock = createBlock(entryTime, entry);
    } else {
      // Add to current block
      currentBlock.entries.push(entry);
      currentBlock.totalCost += entry.costUSD;
    }
  }

  if (currentBlock) {
    // Check if current block is still active
    const lastEntry = currentBlock.entries[currentBlock.entries.length - 1];
    const timeSinceLastActivity = now.getTime() - new Date(lastEntry.timestamp).getTime();
    const timeInBlock = now.getTime() - currentBlock.startTime.getTime();
    currentBlock.isActive = timeSinceLastActivity < BLOCK_DURATION_MS && timeInBlock < BLOCK_DURATION_MS;
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Get the current (most recent active) billing block.
 */
export function getCurrentBlock(entries: UsageEntry[], now: Date = new Date()): BillingBlock | null {
  const blocks = computeBlocks(entries, now);
  if (blocks.length === 0) return null;

  const lastBlock = blocks[blocks.length - 1];
  return lastBlock.isActive ? lastBlock : null;
}

/**
 * Get elapsed time in the current block as a fraction (0-1).
 */
export function getBlockProgress(block: BillingBlock, now: Date = new Date()): number {
  const elapsed = now.getTime() - block.startTime.getTime();
  return Math.min(1, Math.max(0, elapsed / BLOCK_DURATION_MS));
}

/**
 * Get remaining time in the current block in milliseconds.
 */
export function getBlockRemaining(block: BillingBlock, now: Date = new Date()): number {
  const remaining = block.endTime.getTime() - now.getTime();
  return Math.max(0, remaining);
}

function createBlock(entryTime: Date, firstEntry: UsageEntry): BillingBlock {
  const startTime = floorToHour(entryTime);
  return {
    startTime,
    endTime: new Date(startTime.getTime() + BLOCK_DURATION_MS),
    totalCost: firstEntry.costUSD,
    entries: [firstEntry],
    isActive: true,
  };
}

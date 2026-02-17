import { useMemo } from 'react';
import type { UsageEntry, BillingBlock } from '../core/types.js';
import { computeBlocks, getCurrentBlock, getBlockProgress, getBlockRemaining } from '../core/billing-block.js';

interface BillingBlockState {
  /** All computed billing blocks */
  allBlocks: BillingBlock[];
  /** The currently active block (null if none) */
  currentBlock: BillingBlock | null;
  /** Progress through current block (0-1) */
  progress: number;
  /** Remaining time in ms */
  remainingMs: number;
}

/**
 * Hook that computes billing blocks from usage entries.
 */
export function useBillingBlock(entries: UsageEntry[], now: Date = new Date()): BillingBlockState {
  return useMemo(() => {
    const allBlocks = computeBlocks(entries, now);
    const currentBlock = getCurrentBlock(entries, now);
    const progress = currentBlock ? getBlockProgress(currentBlock, now) : 0;
    const remainingMs = currentBlock ? getBlockRemaining(currentBlock, now) : 0;

    return {
      allBlocks,
      currentBlock,
      progress,
      remainingMs,
    };
  }, [entries, now]);
}

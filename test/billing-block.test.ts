import { describe, it, expect } from 'vitest';
import { floorToHour, computeBlocks, getCurrentBlock, getBlockProgress, getBlockRemaining } from '../src/core/billing-block.js';
import type { UsageEntry } from '../src/core/types.js';

let reqCounter = 0;
function makeEntry(timestamp: string, cost: number = 0.01): UsageEntry {
  return {
    timestamp,
    sessionId: 'test-session',
    requestId: `req-${++reqCounter}`,
    model: 'claude-sonnet-4-20250514',
    inputTokens: 100,
    outputTokens: 50,
    cacheCreationTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    cacheReadTokens: 0,
    costUSD: cost,
    source: '/test.jsonl',
  };
}

describe('floorToHour', () => {
  it('floors to start of hour', () => {
    const date = new Date('2026-02-17T10:35:42.123Z');
    const floored = floorToHour(date);
    expect(floored.toISOString()).toBe('2026-02-17T10:00:00.000Z');
  });

  it('keeps exact hour unchanged', () => {
    const date = new Date('2026-02-17T10:00:00.000Z');
    const floored = floorToHour(date);
    expect(floored.toISOString()).toBe('2026-02-17T10:00:00.000Z');
  });
});

describe('computeBlocks', () => {
  it('returns empty array for no entries', () => {
    expect(computeBlocks([])).toEqual([]);
  });

  it('creates a single block for entries within 5 hours', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.01),
      makeEntry('2026-02-17T10:30:00.000Z', 0.02),
      makeEntry('2026-02-17T11:00:00.000Z', 0.03),
    ];
    const now = new Date('2026-02-17T12:00:00.000Z');
    const blocks = computeBlocks(entries, now);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].startTime.toISOString()).toBe('2026-02-17T10:00:00.000Z');
    expect(blocks[0].endTime.toISOString()).toBe('2026-02-17T15:00:00.000Z');
    expect(blocks[0].totalCost).toBeCloseTo(0.06);
    expect(blocks[0].entries).toHaveLength(3);
    expect(blocks[0].isActive).toBe(true);
  });

  it('creates new block when gap > 5 hours', () => {
    const entries = [
      makeEntry('2026-02-17T08:00:00.000Z', 0.01),
      makeEntry('2026-02-17T09:00:00.000Z', 0.02),
      // 7-hour gap
      makeEntry('2026-02-17T16:00:00.000Z', 0.03),
      makeEntry('2026-02-17T17:00:00.000Z', 0.04),
    ];
    const now = new Date('2026-02-17T18:00:00.000Z');
    const blocks = computeBlocks(entries, now);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].totalCost).toBeCloseTo(0.03);
    expect(blocks[0].isActive).toBe(false);
    expect(blocks[1].totalCost).toBeCloseTo(0.07);
    expect(blocks[1].isActive).toBe(true);
  });

  it('creates new block when entry exceeds 5h window', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.01),
      makeEntry('2026-02-17T14:00:00.000Z', 0.02),
      // This is 5h+ from block start (10:00)
      makeEntry('2026-02-17T15:01:00.000Z', 0.03),
    ];
    const now = new Date('2026-02-17T16:00:00.000Z');
    const blocks = computeBlocks(entries, now);

    expect(blocks).toHaveLength(2);
  });

  it('marks last block as inactive if old', () => {
    const entries = [
      makeEntry('2026-02-17T08:00:00.000Z', 0.01),
    ];
    // 6 hours later — block expired
    const now = new Date('2026-02-17T14:00:00.000Z');
    const blocks = computeBlocks(entries, now);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].isActive).toBe(false);
  });

  it('handles unsorted entries', () => {
    const entries = [
      makeEntry('2026-02-17T11:00:00.000Z', 0.03),
      makeEntry('2026-02-17T10:00:00.000Z', 0.01),
      makeEntry('2026-02-17T10:30:00.000Z', 0.02),
    ];
    const now = new Date('2026-02-17T12:00:00.000Z');
    const blocks = computeBlocks(entries, now);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].entries).toHaveLength(3);
    expect(blocks[0].totalCost).toBeCloseTo(0.06);
  });
});

describe('getCurrentBlock', () => {
  it('returns null for no entries', () => {
    expect(getCurrentBlock([])).toBeNull();
  });

  it('returns active block', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.05),
    ];
    const now = new Date('2026-02-17T11:00:00.000Z');
    const block = getCurrentBlock(entries, now);

    expect(block).not.toBeNull();
    expect(block!.totalCost).toBe(0.05);
  });

  it('returns null when last block is expired', () => {
    const entries = [
      makeEntry('2026-02-17T08:00:00.000Z', 0.05),
    ];
    const now = new Date('2026-02-17T14:00:00.000Z');
    expect(getCurrentBlock(entries, now)).toBeNull();
  });
});

describe('getBlockProgress', () => {
  it('returns 0 at block start', () => {
    const entries = [makeEntry('2026-02-17T10:00:00.000Z')];
    const block = getCurrentBlock(entries, new Date('2026-02-17T10:00:00.000Z'))!;
    expect(getBlockProgress(block, new Date('2026-02-17T10:00:00.000Z'))).toBe(0);
  });

  it('returns 0.5 at halfway point', () => {
    const entries = [makeEntry('2026-02-17T10:00:00.000Z')];
    const block = getCurrentBlock(entries, new Date('2026-02-17T12:30:00.000Z'))!;
    expect(getBlockProgress(block, new Date('2026-02-17T12:30:00.000Z'))).toBe(0.5);
  });

  it('clamps at 1', () => {
    const entries = [makeEntry('2026-02-17T10:00:00.000Z')];
    const block = getCurrentBlock(entries, new Date('2026-02-17T10:01:00.000Z'))!;
    expect(getBlockProgress(block, new Date('2026-02-17T16:00:00.000Z'))).toBe(1);
  });
});

describe('getBlockRemaining', () => {
  it('returns full duration at block start', () => {
    const entries = [makeEntry('2026-02-17T10:00:00.000Z')];
    const block = getCurrentBlock(entries, new Date('2026-02-17T10:00:00.000Z'))!;
    const remaining = getBlockRemaining(block, new Date('2026-02-17T10:00:00.000Z'));
    expect(remaining).toBe(5 * 60 * 60 * 1000);
  });

  it('returns 0 past block end', () => {
    const entries = [makeEntry('2026-02-17T10:00:00.000Z')];
    const block = getCurrentBlock(entries, new Date('2026-02-17T10:01:00.000Z'))!;
    expect(getBlockRemaining(block, new Date('2026-02-17T16:00:00.000Z'))).toBe(0);
  });
});

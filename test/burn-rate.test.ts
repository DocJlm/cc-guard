import { describe, it, expect } from 'vitest';
import { calculateBurnRate } from '../src/core/burn-rate.js';
import type { BillingBlock, UsageEntry } from '../src/core/types.js';

let reqCounter = 0;
function makeEntry(timestamp: string, cost: number): UsageEntry {
  return {
    timestamp,
    sessionId: 'test',
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

function makeBlock(entries: UsageEntry[]): BillingBlock {
  const start = new Date(entries[0].timestamp);
  start.setUTCMinutes(0, 0, 0);
  return {
    startTime: start,
    endTime: new Date(start.getTime() + 5 * 60 * 60 * 1000),
    totalCost: entries.reduce((s, e) => s + e.costUSD, 0),
    entries,
    isActive: true,
  };
}

describe('calculateBurnRate', () => {
  it('calculates basic cost per hour', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.50),
      makeEntry('2026-02-17T10:30:00.000Z', 0.50),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z'); // 1 hour in

    const rate = calculateBurnRate(block, now);

    // $1.00 over 1 hour = $1.00/hr
    expect(rate.costPerHour).toBeCloseTo(1.0, 1);
  });

  it('projects block total', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 1.00),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z'); // 1 hour in, 4 remaining

    const rate = calculateBurnRate(block, now);

    // $1.00/hr * 4 remaining + $1.00 current = $5.00
    expect(rate.projectedBlockTotal).toBeCloseTo(5.0, 1);
  });

  it('detects rising trend', () => {
    // Low cost early, high cost recently
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.01),
      makeEntry('2026-02-17T10:10:00.000Z', 0.01),
      makeEntry('2026-02-17T10:50:00.000Z', 0.50),
      makeEntry('2026-02-17T10:55:00.000Z', 0.50),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z');

    const rate = calculateBurnRate(block, now);
    expect(rate.trend).toBe('rising');
  });

  it('detects falling trend', () => {
    // High cost early, low cost recently
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 2.00),
      makeEntry('2026-02-17T10:10:00.000Z', 2.00),
      makeEntry('2026-02-17T10:20:00.000Z', 2.00),
      makeEntry('2026-02-17T10:50:00.000Z', 0.01),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z');

    const rate = calculateBurnRate(block, now);
    expect(rate.trend).toBe('falling');
  });

  it('returns stable for consistent rate', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.10),
      makeEntry('2026-02-17T10:15:00.000Z', 0.10),
      makeEntry('2026-02-17T10:30:00.000Z', 0.10),
      makeEntry('2026-02-17T10:45:00.000Z', 0.10),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z');

    const rate = calculateBurnRate(block, now);
    expect(rate.trend).toBe('stable');
  });

  it('generates sparkline data', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.10),
      makeEntry('2026-02-17T10:30:00.000Z', 0.20),
      makeEntry('2026-02-17T10:45:00.000Z', 0.15),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T11:00:00.000Z');

    const rate = calculateBurnRate(block, now);
    expect(rate.sparklineData).toHaveLength(30);
    // At least some buckets should have data
    expect(rate.sparklineData.some(v => v > 0)).toBe(true);
  });

  it('handles very short elapsed time', () => {
    const entries = [
      makeEntry('2026-02-17T10:00:00.000Z', 0.01),
    ];
    const block = makeBlock(entries);
    const now = new Date('2026-02-17T10:00:01.000Z'); // 1 second in

    const rate = calculateBurnRate(block, now);
    expect(rate.costPerHour).toBeGreaterThan(0);
    expect(isFinite(rate.costPerHour)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { getPricingKey, getPricing, calculateEntryCost, getModelBreakdown, getSessionSummaries, getTotalCost, getTotalTokens } from '../src/core/cost-calculator.js';
import type { UsageEntry } from '../src/core/types.js';

describe('getPricingKey', () => {
  it('parses new-format Opus models', () => {
    expect(getPricingKey('claude-opus-4-6')).toBe('opus-4-6');
    expect(getPricingKey('claude-opus-4-5')).toBe('opus-4-5');
  });

  it('parses new-format Opus with date suffix', () => {
    expect(getPricingKey('claude-opus-4-1-20250414')).toBe('opus-4-1');
  });

  it('parses new-format Sonnet models', () => {
    expect(getPricingKey('claude-sonnet-4-5-20250929')).toBe('sonnet-4-5');
    expect(getPricingKey('claude-sonnet-4-20250514')).toBe('sonnet-4-0');
  });

  it('parses new-format Haiku models', () => {
    expect(getPricingKey('claude-haiku-4-5-20251001')).toBe('haiku-4-5');
  });

  it('parses old-format models (claude-{version}-{family})', () => {
    expect(getPricingKey('claude-3-7-sonnet-20250219')).toBe('sonnet-3-7');
    expect(getPricingKey('claude-3-5-haiku-20241022')).toBe('haiku-3-5');
    expect(getPricingKey('claude-3-haiku-20240307')).toBe('haiku-3');
    expect(getPricingKey('claude-3-opus-20240229')).toBe('opus-3');
  });

  it('returns null for non-Anthropic models', () => {
    expect(getPricingKey('glm-4.7')).toBeNull();
    expect(getPricingKey('gpt-4')).toBeNull();
    expect(getPricingKey('unknown')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getPricingKey('Claude-OPUS-4-6')).toBe('opus-4-6');
    expect(getPricingKey('CLAUDE-SONNET-4-5-20250929')).toBe('sonnet-4-5');
  });
});

describe('getPricing', () => {
  it('returns correct pricing for Opus 4.6', () => {
    const p = getPricing('claude-opus-4-6');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(5);
    expect(p!.output).toBe(25);
  });

  it('returns correct pricing for Opus 4.5', () => {
    const p = getPricing('claude-opus-4-5');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(5);
    expect(p!.output).toBe(25);
  });

  it('returns correct pricing for Opus 4.1 (higher tier)', () => {
    const p = getPricing('claude-opus-4-1-20250414');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(15);
    expect(p!.output).toBe(75);
  });

  it('returns correct pricing for Sonnet 4.5', () => {
    const p = getPricing('claude-sonnet-4-5-20250929');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(3);
    expect(p!.output).toBe(15);
  });

  it('returns correct pricing for Sonnet 4.0', () => {
    const p = getPricing('claude-sonnet-4-20250514');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(3);
    expect(p!.output).toBe(15);
  });

  it('returns correct pricing for old Sonnet 3.7', () => {
    const p = getPricing('claude-3-7-sonnet-20250219');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(3);
    expect(p!.output).toBe(15);
  });

  it('returns correct pricing for Haiku 4.5', () => {
    const p = getPricing('claude-haiku-4-5-20251001');
    expect(p).not.toBeNull();
    expect(p!.input).toBe(1);
    expect(p!.output).toBe(5);
  });

  it('returns null for unknown models', () => {
    expect(getPricing('glm-4.7')).toBeNull();
    expect(getPricing('gpt-4')).toBeNull();
  });

  it('supports custom pricing with exact match', () => {
    const custom = {
      'glm-4.7': { input: 1, output: 4, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 },
    };
    const p = getPricing('glm-4.7', custom);
    expect(p).not.toBeNull();
    expect(p!.input).toBe(1);
    expect(p!.output).toBe(4);
  });

  it('supports custom pricing with substring match', () => {
    const custom = {
      'glm': { input: 2, output: 8, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 },
    };
    const p = getPricing('glm-4.7', custom);
    expect(p).not.toBeNull();
    expect(p!.input).toBe(2);
  });

  it('custom pricing overrides built-in', () => {
    const custom = {
      'claude-opus-4-6': { input: 99, output: 99, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 },
    };
    const p = getPricing('claude-opus-4-6', custom);
    expect(p!.input).toBe(99);
  });
});

describe('calculateEntryCost', () => {
  it('calculates Opus 4.6 output cost correctly ($25/MTok)', () => {
    const cost = calculateEntryCost('claude-opus-4-6', 0, 1_000_000, 0, 0, 0);
    expect(cost).toBeCloseTo(25.0);
  });

  it('calculates Opus 4.1 output cost correctly ($75/MTok)', () => {
    const cost = calculateEntryCost('claude-opus-4-1-20250414', 0, 1_000_000, 0, 0, 0);
    expect(cost).toBeCloseTo(75.0);
  });

  it('calculates Sonnet input cost correctly ($3/MTok)', () => {
    const cost = calculateEntryCost('claude-sonnet-4-20250514', 1_000_000, 0, 0, 0, 0);
    expect(cost).toBeCloseTo(3.0);
  });

  it('calculates Haiku 4.5 cost correctly', () => {
    // 1M in * $1 + 1M out * $5 = $6
    const cost = calculateEntryCost('claude-haiku-4-5-20251001', 1_000_000, 1_000_000, 0, 0, 0);
    expect(cost).toBeCloseTo(6.0);
  });

  it('calculates two-layer cache costs separately', () => {
    // Sonnet 4.5: 1M 5m cache * $3.75 + 1M 1h cache * $6 = $9.75
    const cost = calculateEntryCost('claude-sonnet-4-5-20250929', 0, 0, 1_000_000, 1_000_000, 0);
    expect(cost).toBeCloseTo(9.75);
  });

  it('returns 0 for unknown models', () => {
    const cost = calculateEntryCost('glm-4.7', 1_000_000, 1_000_000, 0, 0, 0);
    expect(cost).toBe(0);
  });
});

describe('getModelBreakdown', () => {
  const makeEntry = (model: string, input: number, output: number): UsageEntry => ({
    timestamp: '2026-02-17T10:00:00.000Z',
    sessionId: 'sess-001',
    requestId: `req-${Math.random()}`,
    model,
    inputTokens: input,
    outputTokens: output,
    cacheCreationTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    cacheReadTokens: 0,
    costUSD: 0.01,
    source: '/test.jsonl',
  });

  it('aggregates by model', () => {
    const entries = [
      makeEntry('claude-opus-4-6', 100, 50),
      makeEntry('claude-opus-4-6', 200, 100),
      makeEntry('claude-sonnet-4-20250514', 300, 150),
    ];
    const breakdown = getModelBreakdown(entries);
    expect(breakdown).toHaveLength(2);
  });

  it('marks unknown models with hasPricing=false', () => {
    const entries = [makeEntry('glm-4.7', 100, 50)];
    const breakdown = getModelBreakdown(entries);
    expect(breakdown[0].hasPricing).toBe(false);
  });

  it('marks known models with hasPricing=true', () => {
    const entries = [makeEntry('claude-opus-4-6', 100, 50)];
    const breakdown = getModelBreakdown(entries);
    expect(breakdown[0].hasPricing).toBe(true);
  });

  it('calculates totalTokens', () => {
    const entry: UsageEntry = {
      timestamp: '2026-02-17T10:00:00.000Z',
      sessionId: 'sess-001',
      requestId: 'req-1',
      model: 'claude-opus-4-6',
      inputTokens: 100,
      outputTokens: 200,
      cacheCreationTokens: 300,
      cacheWrite5mTokens: 100,
      cacheWrite1hTokens: 200,
      cacheReadTokens: 400,
      costUSD: 0.01,
      source: '/test.jsonl',
    };
    const breakdown = getModelBreakdown([entry]);
    // total = 100 + 200 + 300 + 400 = 1000
    expect(breakdown[0].totalTokens).toBe(1000);
  });
});

describe('getSessionSummaries', () => {
  it('calculates totalTokens per session', () => {
    const entry: UsageEntry = {
      timestamp: '2026-02-17T10:00:00.000Z',
      sessionId: 'sess-001',
      requestId: 'req-1',
      model: 'claude-opus-4-6',
      inputTokens: 500,
      outputTokens: 200,
      cacheCreationTokens: 100,
      cacheWrite5mTokens: 50,
      cacheWrite1hTokens: 50,
      cacheReadTokens: 300,
      costUSD: 0.01,
      source: '/home/.claude/projects/my-project/sess-001.jsonl',
    };
    const summaries = getSessionSummaries([entry]);
    expect(summaries).toHaveLength(1);
    // total = 500 + 200 + 100 + 300 = 1100
    expect(summaries[0].totalTokens).toBe(1100);
  });
});

describe('getTotalTokens', () => {
  it('sums all tokens across entries', () => {
    const entries: UsageEntry[] = [
      { timestamp: '', sessionId: '', requestId: '', model: '', inputTokens: 100, outputTokens: 50, cacheCreationTokens: 20, cacheWrite5mTokens: 10, cacheWrite1hTokens: 10, cacheReadTokens: 30, costUSD: 0, source: '' },
      { timestamp: '', sessionId: '', requestId: '', model: '', inputTokens: 200, outputTokens: 100, cacheCreationTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0, cacheReadTokens: 0, costUSD: 0, source: '' },
    ];
    // (100+50+20+30) + (200+100+0+0) = 200 + 300 = 500
    expect(getTotalTokens(entries)).toBe(500);
  });
});

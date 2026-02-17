import { describe, it, expect } from 'vitest';
import { parseLine, parseLines } from '../src/core/jsonl-parser.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('parseLine', () => {
  it('parses a valid assistant usage entry', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      sessionId: 'sess-001',
      requestId: 'req-001',
      message: {
        model: 'claude-sonnet-4-20250514',
        role: 'assistant',
        usage: {
          input_tokens: 1500,
          output_tokens: 300,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: 12000,
        },
        stop_reason: 'end_turn',
      },
    });

    const entry = parseLine(line, '/test/path.jsonl');
    expect(entry).not.toBeNull();
    expect(entry!.timestamp).toBe('2026-02-17T10:00:00.000Z');
    expect(entry!.sessionId).toBe('sess-001');
    expect(entry!.requestId).toBe('req-001');
    expect(entry!.model).toBe('claude-sonnet-4-20250514');
    expect(entry!.inputTokens).toBe(1500);
    expect(entry!.outputTokens).toBe(300);
    expect(entry!.cacheCreationTokens).toBe(5000);
    expect(entry!.cacheReadTokens).toBe(12000);
    expect(entry!.costUSD).toBeGreaterThan(0);
    expect(entry!.source).toBe('/test/path.jsonl');
  });

  it('calculates cost correctly for sonnet model', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'claude-sonnet-4-20250514',
        usage: {
          input_tokens: 1_000_000,
          output_tokens: 0,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    });
    const entry = parseLine(line, '/test');
    // 1M input tokens * $3/MTok = $3.00
    expect(entry!.costUSD).toBeCloseTo(3.0);
  });

  it('calculates cost correctly for opus 4.6 model (fixed pricing)', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'claude-opus-4-6',
        usage: {
          input_tokens: 0,
          output_tokens: 1_000_000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    });
    const entry = parseLine(line, '/test');
    // Opus 4.6: 1M output tokens * $25/MTok = $25.00 (NOT $75!)
    expect(entry!.costUSD).toBeCloseTo(25.0);
  });

  it('calculates cost correctly for opus 4.1 model (old pricing)', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'claude-opus-4-1-20250414',
        usage: {
          input_tokens: 0,
          output_tokens: 1_000_000,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    });
    const entry = parseLine(line, '/test');
    // Opus 4.1: 1M output tokens * $75/MTok = $75.00
    expect(entry!.costUSD).toBeCloseTo(75.0);
  });

  it('parses two-layer cache tokens', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'claude-sonnet-4-5-20250929',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_creation_input_tokens: 30000,
          cache_read_input_tokens: 50000,
          cache_creation: {
            ephemeral_5m_input_tokens: 10000,
            ephemeral_1h_input_tokens: 20000,
          },
        },
      },
    });
    const entry = parseLine(line, '/test');
    expect(entry).not.toBeNull();
    expect(entry!.cacheWrite5mTokens).toBe(10000);
    expect(entry!.cacheWrite1hTokens).toBe(20000);
    expect(entry!.cacheCreationTokens).toBe(30000);
    // Cost: 1K*3 + 500*15 + 10K*3.75 + 20K*6 + 50K*0.30 = 3+7.5+37.5+120+15 = 183 / 1M
    // = 0.003 + 0.0075 + 0.0375 + 0.12 + 0.015 = $0.183
    expect(entry!.costUSD).toBeCloseTo(0.183);
  });

  it('falls back to flat cache field when no cache_creation detail', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'claude-sonnet-4-20250514',
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: 0,
        },
      },
    });
    const entry = parseLine(line, '/test');
    expect(entry).not.toBeNull();
    // Without detail, all cache goes to 5m bucket
    expect(entry!.cacheWrite5mTokens).toBe(5000);
    expect(entry!.cacheWrite1hTokens).toBe(0);
    expect(entry!.cacheCreationTokens).toBe(5000);
  });

  it('returns cost=0 for non-Anthropic models', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: {
        model: 'glm-4.7',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      },
    });
    const entry = parseLine(line, '/test');
    expect(entry).not.toBeNull();
    expect(entry!.costUSD).toBe(0);
    expect(entry!.inputTokens).toBe(1000);
    expect(entry!.outputTokens).toBe(500);
  });

  it('returns null for empty line', () => {
    expect(parseLine('', '/test')).toBeNull();
    expect(parseLine('  ', '/test')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseLine('not json', '/test')).toBeNull();
    expect(parseLine('{broken', '/test')).toBeNull();
  });

  it('returns null for entries without timestamp', () => {
    const line = JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 100 } } });
    expect(parseLine(line, '/test')).toBeNull();
  });

  it('returns null for user type entries', () => {
    const line = JSON.stringify({
      type: 'user',
      timestamp: '2026-02-17T10:00:00.000Z',
      message: { role: 'user', content: 'hello' },
    });
    expect(parseLine(line, '/test')).toBeNull();
  });

  it('returns null for file-history-snapshot entries', () => {
    const line = JSON.stringify({
      type: 'file-history-snapshot',
      timestamp: '2026-02-17T10:00:00.000Z',
      snapshot: {},
    });
    expect(parseLine(line, '/test')).toBeNull();
  });

  it('uses costUSD if provided (future-proofing)', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      requestId: 'req-001',
      message: { usage: { input_tokens: 100 } },
      costUSD: 0.42,
    });
    const entry = parseLine(line, '/test');
    expect(entry!.costUSD).toBe(0.42);
  });

  it('defaults missing fields gracefully', () => {
    const line = JSON.stringify({
      type: 'assistant',
      timestamp: '2026-02-17T10:00:00.000Z',
      message: { usage: { input_tokens: 100 } },
    });
    const entry = parseLine(line, '/test');
    expect(entry).not.toBeNull();
    expect(entry!.sessionId).toBe('');
    expect(entry!.requestId).toBe('');
    expect(entry!.model).toBe('unknown');
    expect(entry!.outputTokens).toBe(0);
    expect(entry!.cacheCreationTokens).toBe(0);
    expect(entry!.cacheWrite5mTokens).toBe(0);
    expect(entry!.cacheWrite1hTokens).toBe(0);
    expect(entry!.cacheReadTokens).toBe(0);
  });
});

describe('parseLines', () => {
  it('deduplicates by requestId, keeping last entry', () => {
    const content = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-02-17T10:00:00.000Z', requestId: 'req-1', message: { usage: { input_tokens: 100, output_tokens: 10 }, model: 'claude-sonnet-4-20250514' } }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-02-17T10:00:01.000Z', requestId: 'req-1', message: { usage: { input_tokens: 100, output_tokens: 50 }, model: 'claude-sonnet-4-20250514' } }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-02-17T10:01:00.000Z', requestId: 'req-2', message: { usage: { input_tokens: 200, output_tokens: 80 }, model: 'claude-sonnet-4-20250514' } }),
    ].join('\n');

    const entries = parseLines(content, '/test');
    expect(entries).toHaveLength(2);
    // req-1 should have the last entry's output_tokens
    const req1 = entries.find(e => e.requestId === 'req-1');
    expect(req1!.outputTokens).toBe(50);
  });

  it('skips non-assistant entries', () => {
    const content = [
      JSON.stringify({ type: 'user', timestamp: '2026-02-17T10:00:00.000Z', message: { role: 'user', content: 'hi' } }),
      JSON.stringify({ type: 'assistant', timestamp: '2026-02-17T10:01:00.000Z', requestId: 'req-1', message: { usage: { input_tokens: 100 }, model: 'claude-sonnet-4-20250514' } }),
      JSON.stringify({ type: 'file-history-snapshot', timestamp: '2026-02-17T10:02:00.000Z', snapshot: {} }),
    ].join('\n');

    const entries = parseLines(content, '/test');
    expect(entries).toHaveLength(1);
  });

  it('parses sample.jsonl fixture with dedup', () => {
    const fixturePath = join(__dirname, 'fixtures', 'sample.jsonl');
    const content = readFileSync(fixturePath, 'utf-8');
    const entries = parseLines(content, fixturePath);

    // 8 lines: 7 assistant (1 duplicate req-002), 1 user → 6 unique entries
    expect(entries).toHaveLength(6);
    // All entries should have calculated costs >= 0
    for (const entry of entries) {
      expect(entry.costUSD).toBeGreaterThanOrEqual(0);
    }
  });
});

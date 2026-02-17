import { describe, it, expect } from 'vitest';
import { abbreviateModel, formatTokenRate, formatCost, formatTokens } from '../src/utils/format.js';

describe('abbreviateModel', () => {
  it('abbreviates new-format Opus models', () => {
    expect(abbreviateModel('claude-opus-4-6')).toBe('opus-4.6');
    expect(abbreviateModel('claude-opus-4-5')).toBe('opus-4.5');
  });

  it('abbreviates new-format Sonnet with date', () => {
    expect(abbreviateModel('claude-sonnet-4-20250514')).toBe('sonnet-4');
  });

  it('abbreviates new-format Sonnet with minor version', () => {
    expect(abbreviateModel('claude-sonnet-4-5-20250929')).toBe('sonnet-4.5');
  });

  it('abbreviates old-format models', () => {
    expect(abbreviateModel('claude-3-7-sonnet-20250219')).toBe('sonnet-3.7');
    expect(abbreviateModel('claude-3-5-haiku-20241022')).toBe('haiku-3.5');
    expect(abbreviateModel('claude-3-haiku-20240307')).toBe('haiku-3');
    expect(abbreviateModel('claude-3-opus-20240229')).toBe('opus-3');
  });

  it('passes through non-Claude models', () => {
    expect(abbreviateModel('glm-4.7')).toBe('glm-4.7');
    expect(abbreviateModel('gpt-4')).toBe('gpt-4');
  });
});

describe('formatTokenRate', () => {
  it('formats token rate per hour', () => {
    expect(formatTokenRate(245000)).toBe('245.0K/hr');
    expect(formatTokenRate(1500000)).toBe('1.5M/hr');
    expect(formatTokenRate(500)).toBe('500/hr');
  });
});

describe('formatCost', () => {
  it('formats small costs', () => {
    expect(formatCost(0.001)).toBe('$0.0010');
    expect(formatCost(0.42)).toBe('$0.420');
    expect(formatCost(15.04)).toBe('$15.04');
  });
});

describe('formatTokens', () => {
  it('formats token counts', () => {
    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(1500)).toBe('1.5K');
    expect(formatTokens(1500000)).toBe('1.5M');
  });
});

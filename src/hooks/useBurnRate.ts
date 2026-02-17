import { useMemo } from 'react';
import type { BillingBlock, BurnRate, TokenBurnRate } from '../core/types.js';
import { calculateBurnRate, calculateTokenBurnRate } from '../core/burn-rate.js';

const defaultBurnRate: BurnRate = {
  costPerHour: 0,
  recentCostPerHour: 0,
  projectedBlockTotal: 0,
  trend: 'stable',
  sparklineData: [],
};

const defaultTokenBurnRate: TokenBurnRate = {
  tokensPerHour: 0,
  recentTokensPerHour: 0,
  projectedBlockTokens: 0,
  trend: 'stable',
  sparklineData: [],
};

interface BurnRateResult {
  costRate: BurnRate;
  tokenRate: TokenBurnRate;
}

/**
 * Hook that calculates both cost and token burn rates from the current billing block.
 */
export function useBurnRate(block: BillingBlock | null, now: Date = new Date()): BurnRateResult {
  return useMemo(() => {
    if (!block) return { costRate: defaultBurnRate, tokenRate: defaultTokenBurnRate };
    return {
      costRate: calculateBurnRate(block, now),
      tokenRate: calculateTokenBurnRate(block, now),
    };
  }, [block, now]);
}

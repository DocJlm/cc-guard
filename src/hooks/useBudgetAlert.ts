import { useMemo } from 'react';
import type { BudgetAlert, Config } from '../core/types.js';

/**
 * Hook that checks budget thresholds and returns alert state.
 */
export function useBudgetAlert(currentCost: number, config: Config): BudgetAlert {
  return useMemo(() => {
    const { budgetPerBlock, warningThreshold, criticalThreshold, alertsEnabled } = config;
    const percentage = (currentCost / budgetPerBlock) * 100;

    if (!alertsEnabled) {
      return {
        level: 'none',
        percentage,
        budget: budgetPerBlock,
        currentCost,
        message: '',
      };
    }

    if (percentage >= criticalThreshold) {
      return {
        level: 'critical',
        percentage,
        budget: budgetPerBlock,
        currentCost,
        message: `CRITICAL: ${Math.round(percentage)}% of $${budgetPerBlock} budget used!`,
      };
    }

    if (percentage >= warningThreshold) {
      return {
        level: 'warning',
        percentage,
        budget: budgetPerBlock,
        currentCost,
        message: `Warning: ${Math.round(percentage)}% of $${budgetPerBlock} budget used`,
      };
    }

    return {
      level: 'none',
      percentage,
      budget: budgetPerBlock,
      currentCost,
      message: '',
    };
  }, [currentCost, config]);
}

import type { Config } from '../core/types.js';

export const defaultConfig: Config = {
  budgetPerBlock: 50,       // $50 per 5-hour block
  warningThreshold: 80,     // 80% → yellow warning
  criticalThreshold: 95,    // 95% → red critical
  alertsEnabled: true,
  pollInterval: 1000,       // 1 second fallback polling
  mode: process.env.ANTHROPIC_API_KEY ? 'api' : 'sub',
};

/** A single parsed entry from a Claude Code JSONL log file */
export interface UsageEntry {
  timestamp: string;
  sessionId: string;
  /** Unique request ID — used for deduplication */
  requestId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Total cache write tokens (sum of 5m + 1h, for backward compat) */
  cacheCreationTokens: number;
  /** 5-minute ephemeral cache write tokens */
  cacheWrite5mTokens: number;
  /** 1-hour ephemeral cache write tokens */
  cacheWrite1hTokens: number;
  cacheReadTokens: number;
  /** Calculated cost in USD */
  costUSD: number;
  /** Source file path */
  source: string;
}

/** A 5-hour billing block */
export interface BillingBlock {
  /** Block start time (floored to UTC hour) */
  startTime: Date;
  /** Block end time (start + 5h) */
  endTime: Date;
  /** Total cost in this block */
  totalCost: number;
  /** All entries in this block */
  entries: UsageEntry[];
  /** Whether this block is currently active */
  isActive: boolean;
}

/** Burn rate statistics */
export interface BurnRate {
  /** Cost per hour (overall for current block) */
  costPerHour: number;
  /** Cost per hour (last 15 minutes) */
  recentCostPerHour: number;
  /** Projected total cost for the current block */
  projectedBlockTotal: number;
  /** Trend: 'rising' | 'falling' | 'stable' */
  trend: 'rising' | 'falling' | 'stable';
  /** Cost data points for sparkline (last 60 minutes, per-minute buckets) */
  sparklineData: number[];
}

/** Token burn rate statistics */
export interface TokenBurnRate {
  /** Tokens per hour (overall for current block) */
  tokensPerHour: number;
  /** Tokens per hour (last 15 minutes) */
  recentTokensPerHour: number;
  /** Projected total tokens for the current block */
  projectedBlockTokens: number;
  /** Trend: 'rising' | 'falling' | 'stable' */
  trend: 'rising' | 'falling' | 'stable';
  /** Token data points for sparkline */
  sparklineData: number[];
}

/** Budget alert levels */
export type AlertLevel = 'none' | 'warning' | 'critical';

/** Budget alert state */
export interface BudgetAlert {
  level: AlertLevel;
  /** Current usage as percentage of budget (0-100+) */
  percentage: number;
  /** Budget limit in USD */
  budget: number;
  /** Current cost in USD */
  currentCost: number;
  /** Message to display */
  message: string;
}

/** Session summary for display */
export interface SessionSummary {
  sessionId: string;
  projectPath: string;
  totalCost: number;
  totalTokens: number;
  entryCount: number;
  lastActivity: Date;
  model: string;
}

/** User configuration */
export interface Config {
  /** Budget per 5-hour block in USD */
  budgetPerBlock: number;
  /** Warning threshold as percentage (0-100) */
  warningThreshold: number;
  /** Critical threshold as percentage (0-100) */
  criticalThreshold: number;
  /** Enable/disable alerts */
  alertsEnabled: boolean;
  /** Custom Claude logs directory (overrides auto-detection) */
  logDir?: string;
  /** Polling interval in ms for file watching fallback */
  pollInterval: number;
  /** Billing mode: 'api' (pay-per-token) or 'sub' (subscription) */
  mode: 'api' | 'sub';
  /** Custom model pricing overrides */
  customPricing?: Record<string, ModelPricingConfig>;
  /** Token budget per block for sub mode */
  tokenBudgetPerBlock?: number;
  /** UI refresh interval in ms */
  refreshInterval?: number;
  /** Panel visibility toggles */
  panels?: PanelConfig;
}

/** Model pricing configuration ($/MTok) */
export interface ModelPricingConfig {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  cacheRead: number;
}

/** Panel visibility configuration */
export interface PanelConfig {
  burnRate?: boolean;
  tokenBreakdown?: boolean;
  sessionList?: boolean;
  sparkline?: boolean;
}

/** Token usage breakdown by model */
export interface ModelBreakdown {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheWrite5mTokens: number;
  cacheWrite1hTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  totalTokens: number;
  entryCount: number;
  /** Whether pricing is available for this model */
  hasPricing: boolean;
}

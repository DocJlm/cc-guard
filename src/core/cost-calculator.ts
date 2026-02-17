import type { UsageEntry, ModelBreakdown, SessionSummary, ModelPricingConfig } from './types.js';

/**
 * Pricing per million tokens.
 * cacheWrite5m = ephemeral 5-minute cache (1.25x input price)
 * cacheWrite1h = ephemeral 1-hour cache (2x input price)
 */
const MODEL_PRICING: Record<string, ModelPricingConfig> = {
  // --- Opus ---
  'opus-4-6':    { input: 5,    output: 25,   cacheWrite5m: 6.25,  cacheWrite1h: 10,   cacheRead: 0.50 },
  'opus-4-5':    { input: 5,    output: 25,   cacheWrite5m: 6.25,  cacheWrite1h: 10,   cacheRead: 0.50 },
  'opus-4-1':    { input: 15,   output: 75,   cacheWrite5m: 18.75, cacheWrite1h: 30,   cacheRead: 1.50 },
  'opus-4-0':    { input: 15,   output: 75,   cacheWrite5m: 18.75, cacheWrite1h: 30,   cacheRead: 1.50 },
  'opus-3':      { input: 15,   output: 75,   cacheWrite5m: 18.75, cacheWrite1h: 30,   cacheRead: 1.50 },
  // --- Sonnet ---
  'sonnet-4-5':  { input: 3,    output: 15,   cacheWrite5m: 3.75,  cacheWrite1h: 6,    cacheRead: 0.30 },
  'sonnet-4-0':  { input: 3,    output: 15,   cacheWrite5m: 3.75,  cacheWrite1h: 6,    cacheRead: 0.30 },
  'sonnet-3-7':  { input: 3,    output: 15,   cacheWrite5m: 3.75,  cacheWrite1h: 6,    cacheRead: 0.30 },
  // --- Haiku ---
  'haiku-4-5':   { input: 1,    output: 5,    cacheWrite5m: 1.25,  cacheWrite1h: 2,    cacheRead: 0.10 },
  'haiku-3-5':   { input: 0.80, output: 4,    cacheWrite5m: 1.00,  cacheWrite1h: 1.60, cacheRead: 0.08 },
  'haiku-3':     { input: 0.25, output: 1.25, cacheWrite5m: 0.30,  cacheWrite1h: 0.50, cacheRead: 0.03 },
};

/**
 * Extract a pricing key from a model ID string.
 *
 * Examples:
 *   "claude-opus-4-6"                → "opus-4-6"
 *   "claude-sonnet-4-20250514"       → "sonnet-4-0"
 *   "claude-sonnet-4-5-20250929"     → "sonnet-4-5"
 *   "claude-3-7-sonnet-20250219"     → "sonnet-3-7" (old naming)
 *   "claude-haiku-4-5-20251001"      → "haiku-4-5"
 *   "claude-3-5-haiku-20241022"      → "haiku-3-5" (old naming)
 *   "claude-3-haiku-20240307"        → "haiku-3" (old naming)
 *   "glm-4.7"                        → null (non-Anthropic)
 *
 * Returns null for non-Anthropic models.
 */
export function getPricingKey(modelId: string): string | null {
  const lower = modelId.toLowerCase();

  // Must contain a Claude family name
  const familyMatch = lower.match(/(opus|sonnet|haiku)/);
  if (!familyMatch) return null;

  const family = familyMatch[1];

  // Old format first: claude-{major}-{minor?}-{family}-{date}
  // e.g. "claude-3-7-sonnet-20250219", "claude-3-5-haiku-20241022", "claude-3-haiku-20240307"
  const oldFmt = lower.match(new RegExp(`(\\d+)(?:-(\\d+))?-${family}`));
  if (oldFmt) {
    const major = oldFmt[1];
    const minor = oldFmt[2];
    // Only match if major is a single digit (3, not 20250219)
    if (major.length === 1) {
      return minor ? `${family}-${major}-${minor}` : `${family}-${major}`;
    }
  }

  // New format: claude-{family}-{major}-{minor?}-{date?}
  // e.g. "claude-opus-4-6", "claude-sonnet-4-5-20250929", "claude-sonnet-4-20250514"
  const newFmt = lower.match(new RegExp(`${family}-(\\d+)(?:-(\\d+))?`));
  if (newFmt) {
    const major = newFmt[1];
    const minor = newFmt[2];
    // If minor looks like a date (4+ digits), treat as x-0
    if (minor && minor.length >= 4) {
      return `${family}-${major}-0`;
    }
    return minor ? `${family}-${major}-${minor}` : `${family}-${major}-0`;
  }

  return null;
}

/**
 * Get pricing for a model. Returns null if model is unknown/non-Anthropic.
 * Checks custom pricing first, then built-in table.
 */
export function getPricing(
  modelId: string,
  customPricing?: Record<string, ModelPricingConfig>,
): ModelPricingConfig | null {
  // 1. Custom pricing — exact match
  if (customPricing) {
    if (customPricing[modelId]) return customPricing[modelId];
    // Substring match
    const lower = modelId.toLowerCase();
    for (const [key, pricing] of Object.entries(customPricing)) {
      if (lower.includes(key.toLowerCase())) return pricing;
    }
  }

  // 2. Built-in pricing table
  const key = getPricingKey(modelId);
  if (key && MODEL_PRICING[key]) return MODEL_PRICING[key];

  return null;
}

/**
 * Calculate the cost of a single usage entry from token counts.
 * Returns 0 for unknown/non-Anthropic models.
 */
export function calculateEntryCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWrite5mTokens: number,
  cacheWrite1hTokens: number,
  cacheReadTokens: number,
  customPricing?: Record<string, ModelPricingConfig>,
): number {
  const pricing = getPricing(model, customPricing);
  if (!pricing) return 0;

  return (
    (inputTokens * pricing.input +
      outputTokens * pricing.output +
      cacheWrite5mTokens * pricing.cacheWrite5m +
      cacheWrite1hTokens * pricing.cacheWrite1h +
      cacheReadTokens * pricing.cacheRead) /
    1_000_000
  );
}

/** Get total tokens for an entry */
function entryTotalTokens(entry: UsageEntry): number {
  return entry.inputTokens + entry.outputTokens + entry.cacheCreationTokens + entry.cacheReadTokens;
}

/**
 * Aggregate entries into per-model breakdowns.
 */
export function getModelBreakdown(
  entries: UsageEntry[],
  customPricing?: Record<string, ModelPricingConfig>,
): ModelBreakdown[] {
  const map = new Map<string, ModelBreakdown>();

  for (const entry of entries) {
    const existing = map.get(entry.model);
    if (existing) {
      existing.inputTokens += entry.inputTokens;
      existing.outputTokens += entry.outputTokens;
      existing.cacheCreationTokens += entry.cacheCreationTokens;
      existing.cacheWrite5mTokens += entry.cacheWrite5mTokens;
      existing.cacheWrite1hTokens += entry.cacheWrite1hTokens;
      existing.cacheReadTokens += entry.cacheReadTokens;
      existing.totalCost += entry.costUSD;
      existing.totalTokens += entryTotalTokens(entry);
      existing.entryCount += 1;
    } else {
      map.set(entry.model, {
        model: entry.model,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        cacheCreationTokens: entry.cacheCreationTokens,
        cacheWrite5mTokens: entry.cacheWrite5mTokens,
        cacheWrite1hTokens: entry.cacheWrite1hTokens,
        cacheReadTokens: entry.cacheReadTokens,
        totalCost: entry.costUSD,
        totalTokens: entryTotalTokens(entry),
        entryCount: 1,
        hasPricing: getPricing(entry.model, customPricing) !== null,
      });
    }
  }

  return [...map.values()].sort((a, b) => b.totalCost - a.totalCost);
}

/**
 * Aggregate entries into per-session summaries.
 */
export function getSessionSummaries(entries: UsageEntry[]): SessionSummary[] {
  const map = new Map<string, SessionSummary>();

  for (const entry of entries) {
    const existing = map.get(entry.sessionId);
    const entryTime = new Date(entry.timestamp);

    if (existing) {
      existing.totalCost += entry.costUSD;
      existing.totalTokens += entryTotalTokens(entry);
      existing.entryCount += 1;
      if (entryTime > existing.lastActivity) {
        existing.lastActivity = entryTime;
        existing.model = entry.model;
      }
    } else {
      // Extract project path from source file path
      const parts = entry.source.replace(/\\/g, '/').split('/');
      const projectDir = parts.length >= 2 ? parts[parts.length - 2] : 'unknown';

      map.set(entry.sessionId, {
        sessionId: entry.sessionId,
        projectPath: projectDir,
        totalCost: entry.costUSD,
        totalTokens: entryTotalTokens(entry),
        entryCount: 1,
        lastActivity: entryTime,
        model: entry.model,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
  );
}

/**
 * Calculate total cost from entries.
 */
export function getTotalCost(entries: UsageEntry[]): number {
  return entries.reduce((sum, e) => sum + e.costUSD, 0);
}

/**
 * Calculate total tokens from entries.
 */
export function getTotalTokens(entries: UsageEntry[]): number {
  return entries.reduce((sum, e) => sum + entryTotalTokens(e), 0);
}

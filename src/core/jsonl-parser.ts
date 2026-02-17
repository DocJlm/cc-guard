import type { UsageEntry, ModelPricingConfig } from './types.js';
import { calculateEntryCost } from './cost-calculator.js';

/**
 * Raw shape of a Claude Code JSONL log entry.
 * Claude Code logs streaming chunks as separate lines with the same requestId.
 * Only type="assistant" entries contain usage data.
 */
interface RawLogEntry {
  timestamp?: string;
  sessionId?: string;
  requestId?: string;
  type?: string; // "user" | "assistant" | "file-history-snapshot" | etc.
  message?: {
    role?: string;
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation?: {
        ephemeral_5m_input_tokens?: number;
        ephemeral_1h_input_tokens?: number;
      };
    };
    stop_reason?: string | null;
  };
  costUSD?: number; // May exist in future versions
}

/**
 * Parse a single JSONL line into a UsageEntry.
 * Returns null if the line is not a valid usage entry.
 * Only processes type="assistant" entries with usage data.
 */
export function parseLine(
  line: string,
  sourcePath: string,
  customPricing?: Record<string, ModelPricingConfig>,
): UsageEntry | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let raw: RawLogEntry;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return null;
  }

  // Must have timestamp
  if (!raw.timestamp) return null;

  // Only process assistant entries (user/system entries don't have usage)
  if (raw.type && raw.type !== 'assistant') return null;

  const usage = raw.message?.usage;
  // Need either usage data or costUSD
  if (!usage && raw.costUSD == null) return null;

  const model = raw.message?.model ?? 'unknown';
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const cacheReadTokens = usage?.cache_read_input_tokens ?? 0;

  // Parse two-layer cache write tokens
  const cacheDetail = usage?.cache_creation;
  const cacheWrite5mTokens = cacheDetail?.ephemeral_5m_input_tokens ?? 0;
  const cacheWrite1hTokens = cacheDetail?.ephemeral_1h_input_tokens ?? 0;

  // Total cache creation: sum of detailed layers, or fallback to flat field
  const cacheCreationTokens = (cacheWrite5mTokens + cacheWrite1hTokens) ||
    (usage?.cache_creation_input_tokens ?? 0);

  // If we have detailed layers, use them; otherwise assign all to 5m (legacy fallback)
  const final5m = (cacheWrite5mTokens + cacheWrite1hTokens) > 0
    ? cacheWrite5mTokens
    : cacheCreationTokens;
  const final1h = (cacheWrite5mTokens + cacheWrite1hTokens) > 0
    ? cacheWrite1hTokens
    : 0;

  // Use costUSD if provided, otherwise calculate from tokens
  const costUSD = raw.costUSD ?? calculateEntryCost(
    model,
    inputTokens,
    outputTokens,
    final5m,
    final1h,
    cacheReadTokens,
    customPricing,
  );

  return {
    timestamp: raw.timestamp,
    sessionId: raw.sessionId ?? '',
    requestId: raw.requestId ?? '',
    model,
    inputTokens,
    outputTokens,
    cacheCreationTokens,
    cacheWrite5mTokens: final5m,
    cacheWrite1hTokens: final1h,
    cacheReadTokens,
    costUSD,
    source: sourcePath,
  };
}

/**
 * Parse multiple JSONL lines into UsageEntry array.
 * Deduplicates by requestId — keeps only the last entry per request
 * (streaming chunks share the same requestId but the last one has final usage).
 */
export function parseLines(
  content: string,
  sourcePath: string,
  customPricing?: Record<string, ModelPricingConfig>,
): UsageEntry[] {
  const lines = content.split('\n');
  const byRequestId = new Map<string, UsageEntry>();
  const noRequestId: UsageEntry[] = [];

  for (const line of lines) {
    const entry = parseLine(line, sourcePath, customPricing);
    if (!entry) continue;

    if (entry.requestId) {
      // Keep latest entry per requestId (overwrites previous chunks)
      byRequestId.set(entry.requestId, entry);
    } else {
      noRequestId.push(entry);
    }
  }

  return [...byRequestId.values(), ...noRequestId];
}

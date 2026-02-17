import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatTokens, formatCost, abbreviateModel } from '../utils/format.js';
import type { ModelBreakdown } from '../core/types.js';

interface TokenBreakdownProps {
  models: ModelBreakdown[];
  mode: 'api' | 'sub';
}

export function TokenBreakdown({ models, mode }: TokenBreakdownProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1} width="100%">
      <Text bold color={colors.tokens}>
        {'📊 Token Breakdown'}
      </Text>
      {models.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No usage data</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {models.map((m) => (
            <Box key={m.model} flexDirection="column">
              {/* Model header line */}
              <Box>
                <Text bold color={colors.text}>{abbreviateModel(m.model)}</Text>
                {!m.hasPricing && <Text color={colors.warning}> ⚠</Text>}
                <Spacer />
                {mode === 'api' ? (
                  <Text color={colors.cost}>{formatCost(m.totalCost)}</Text>
                ) : (
                  <Text color={colors.tokens}>{formatTokens(m.totalTokens)} tok</Text>
                )}
              </Box>
              {/* Row 1: Input / Output */}
              <Box marginLeft={2}>
                <Text dimColor>In </Text>
                <Text color={colors.tokens}>{formatTokens(m.inputTokens)}</Text>
                <Text dimColor>  Out </Text>
                <Text color={colors.tokens}>{formatTokens(m.outputTokens)}</Text>
              </Box>
              {/* Row 2: Cache write (only if non-zero) */}
              {(m.cacheWrite5mTokens > 0 || m.cacheWrite1hTokens > 0) && (
                <Box marginLeft={2}>
                  <Text dimColor>W5m </Text>
                  <Text color={colors.tokens}>{formatTokens(m.cacheWrite5mTokens)}</Text>
                  <Text dimColor>  W1h </Text>
                  <Text color={colors.tokens}>{formatTokens(m.cacheWrite1hTokens)}</Text>
                </Box>
              )}
              {(m.cacheWrite5mTokens === 0 && m.cacheWrite1hTokens === 0 && m.cacheCreationTokens > 0) && (
                <Box marginLeft={2}>
                  <Text dimColor>CW </Text>
                  <Text color={colors.tokens}>{formatTokens(m.cacheCreationTokens)}</Text>
                </Box>
              )}
              {/* Row 3: Cache read (only if non-zero) */}
              {m.cacheReadTokens > 0 && (
                <Box marginLeft={2}>
                  <Text dimColor>CR </Text>
                  <Text color={colors.success}>{formatTokens(m.cacheReadTokens)}</Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

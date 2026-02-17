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
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1}>
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
              <Box>
                <Text bold color={colors.text}>{abbreviateModel(m.model)}</Text>
                {!m.hasPricing && <Text color={colors.warning}> ⚠ No pricing</Text>}
                <Spacer />
                {mode === 'api' ? (
                  <Text color={colors.cost}>{formatCost(m.totalCost)}</Text>
                ) : (
                  <Text color={colors.tokens}>{formatTokens(m.totalTokens)} tok</Text>
                )}
              </Box>
              <Box marginLeft={2} gap={1}>
                <Text dimColor>Input</Text>
                <Text color={colors.tokens}>{formatTokens(m.inputTokens).padStart(7)}</Text>
                <Text dimColor>  Output</Text>
                <Text color={colors.tokens}>{formatTokens(m.outputTokens).padStart(7)}</Text>
              </Box>
              <Box marginLeft={2} gap={1}>
                {(m.cacheWrite5mTokens > 0 || m.cacheWrite1hTokens > 0) ? (
                  <>
                    <Text dimColor>CW-5m</Text>
                    <Text color={colors.tokens}>{formatTokens(m.cacheWrite5mTokens).padStart(7)}</Text>
                    <Text dimColor>  CW-1h </Text>
                    <Text color={colors.tokens}>{formatTokens(m.cacheWrite1hTokens).padStart(7)}</Text>
                  </>
                ) : m.cacheCreationTokens > 0 ? (
                  <>
                    <Text dimColor>CWrite</Text>
                    <Text color={colors.tokens}>{formatTokens(m.cacheCreationTokens).padStart(7)}</Text>
                  </>
                ) : null}
                {m.cacheReadTokens > 0 && (
                  <>
                    <Text dimColor>  CRead</Text>
                    <Text color={colors.success}>{formatTokens(m.cacheReadTokens).padStart(7)}</Text>
                  </>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

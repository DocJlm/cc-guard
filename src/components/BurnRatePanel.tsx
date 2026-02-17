import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatCost, formatRate, formatTokens, formatTokenRate } from '../utils/format.js';
import { Sparkline } from './Sparkline.js';
import type { BurnRate, TokenBurnRate } from '../core/types.js';

interface BurnRatePanelProps {
  costRate: BurnRate;
  tokenRate: TokenBurnRate;
  mode: 'api' | 'sub';
  showSparkline?: boolean;
}

const trendIcon: Record<BurnRate['trend'], string> = {
  rising: '↑',
  falling: '↓',
  stable: '→',
};

const trendColor: Record<BurnRate['trend'], string> = {
  rising: colors.critical,
  falling: colors.success,
  stable: colors.textMuted,
};

export function BurnRatePanel({ costRate, tokenRate, mode, showSparkline = true }: BurnRatePanelProps) {
  if (mode === 'sub') {
    const { tokensPerHour, recentTokensPerHour, projectedBlockTokens, trend, sparklineData } = tokenRate;
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1} width="100%">
        <Text bold color={colors.rate}>
          {'🔥 Burn Rate'}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text dimColor>Rate     </Text>
            <Spacer />
            <Text bold color={colors.rate}>{formatTokenRate(tokensPerHour)}</Text>
            <Text color={trendColor[trend]}> {trendIcon[trend]} {trend}</Text>
          </Box>
          <Box>
            <Text dimColor>Recent   </Text>
            <Spacer />
            <Text color={colors.text}>{formatTokenRate(recentTokensPerHour)}</Text>
            <Text dimColor> (15m)</Text>
          </Box>
          <Box>
            <Text dimColor>Projected</Text>
            <Spacer />
            <Text color={colors.tokens}>{formatTokens(projectedBlockTokens)}</Text>
            <Text dimColor> /blk</Text>
          </Box>
          {showSparkline && sparklineData.length > 0 && (
            <Box marginTop={1}>
              <Text dimColor>Trend </Text>
              <Sparkline data={sparklineData} />
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  const { costPerHour, recentCostPerHour, projectedBlockTotal, trend, sparklineData } = costRate;
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1} width="100%">
      <Text bold color={colors.rate}>
        {'🔥 Burn Rate'}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text dimColor>Rate     </Text>
          <Spacer />
          <Text bold color={colors.rate}>{formatRate(costPerHour)}</Text>
          <Text color={trendColor[trend]}> {trendIcon[trend]} {trend}</Text>
        </Box>
        <Box>
          <Text dimColor>Recent   </Text>
          <Spacer />
          <Text color={colors.text}>{formatRate(recentCostPerHour)}</Text>
          <Text dimColor> (15m)</Text>
        </Box>
        <Box>
          <Text dimColor>Projected</Text>
          <Spacer />
          <Text color={colors.cost}>{formatCost(projectedBlockTotal)}</Text>
          <Text dimColor> /blk</Text>
        </Box>
        {showSparkline && sparklineData.length > 0 && (
          <Box marginTop={1}>
            <Text dimColor>Trend </Text>
            <Sparkline data={sparklineData} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatCost, formatPercent, formatTokens } from '../utils/format.js';
import { getAlertColor } from '../utils/colors.js';
import type { BillingBlock, BudgetAlert } from '../core/types.js';

interface CostPanelProps {
  currentBlock: BillingBlock | null;
  totalCostAllTime: number;
  totalTokensAllTime: number;
  alert: BudgetAlert;
  mode: 'api' | 'sub';
}

export function CostPanel({ currentBlock, totalCostAllTime, totalTokensAllTime, alert, mode }: CostPanelProps) {
  const blockCost = currentBlock?.totalCost ?? 0;
  const entryCount = currentBlock?.entries.length ?? 0;
  const blockTokens = currentBlock?.entries.reduce(
    (sum, e) => sum + e.inputTokens + e.outputTokens + e.cacheCreationTokens + e.cacheReadTokens, 0
  ) ?? 0;

  const borderColor = mode === 'api' && alert.level !== 'none'
    ? getAlertColor(alert.level)
    : colors.border;

  if (mode === 'sub') {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} width="100%">
        <Text bold color={colors.tokens}>
          {'📊 Usage'}
        </Text>
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text dimColor>Block    </Text>
            <Spacer />
            <Text bold color={colors.tokens}>{formatTokens(blockTokens)} tok</Text>
          </Box>
          <Box>
            <Text dimColor>API eq.  </Text>
            <Spacer />
            <Text color={colors.textMuted}>{formatCost(blockCost)}</Text>
          </Box>
          <Box>
            <Text dimColor>Total    </Text>
            <Spacer />
            <Text color={colors.text}>{formatTokens(totalTokensAllTime)} tok</Text>
          </Box>
          <Box>
            <Text dimColor>Calls    </Text>
            <Spacer />
            <Text color={colors.textMuted}>{entryCount}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1} width="100%">
      <Text bold color={colors.cost}>
        {'💰 Cost'}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text dimColor>Block    </Text>
          <Spacer />
          <Text bold color={colors.cost}>{formatCost(blockCost)}</Text>
          <Text dimColor> / {formatCost(alert.budget)}</Text>
        </Box>
        <Box>
          <Text dimColor>Budget   </Text>
          <Spacer />
          <Text color={colors.text}>{formatPercent(alert.percentage)}</Text>
        </Box>
        <Box>
          <Text dimColor>Total    </Text>
          <Spacer />
          <Text color={colors.text}>{formatCost(totalCostAllTime)}</Text>
        </Box>
        <Box>
          <Text dimColor>Calls    </Text>
          <Spacer />
          <Text color={colors.textMuted}>{entryCount}</Text>
        </Box>
      </Box>
    </Box>
  );
}

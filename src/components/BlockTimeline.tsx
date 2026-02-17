import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatDuration } from '../utils/format.js';
import { ProgressBar } from './ProgressBar.js';
import type { BillingBlock } from '../core/types.js';

interface BlockTimelineProps {
  currentBlock: BillingBlock | null;
  progress: number;
  remainingMs: number;
  columns?: number;
}

export function BlockTimeline({ currentBlock, progress, remainingMs, columns = 80 }: BlockTimelineProps) {
  // Adaptive progress bar width
  const barWidth = Math.max(15, Math.min(50, columns - 30));

  if (!currentBlock) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1} width="100%">
        <Text bold color={colors.time}>
          {'⏱  Block Timeline'}
        </Text>
        <Box marginTop={1}>
          <Text dimColor>No active billing block</Text>
        </Box>
      </Box>
    );
  }

  const startStr = currentBlock.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endStr = currentBlock.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1} width="100%">
      <Text bold color={colors.time}>
        {'⏱  Block Timeline'}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <ProgressBar value={progress} width={barWidth} color={colors.time} />
        <Box marginTop={1}>
          <Text dimColor>Window</Text>
          <Spacer />
          <Text color={colors.text}>{startStr}</Text>
          <Text dimColor> → </Text>
          <Text color={colors.text}>{endStr}</Text>
        </Box>
        <Box>
          <Text dimColor>Remaining</Text>
          <Spacer />
          <Text bold color={colors.time}>{formatDuration(remainingMs)}</Text>
        </Box>
      </Box>
    </Box>
  );
}

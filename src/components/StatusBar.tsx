import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatTimeAgo } from '../utils/format.js';

interface StatusBarProps {
  isWatching: boolean;
  fileCount: number;
  lastUpdate: Date | null;
  error: string | null;
  mode: 'api' | 'sub';
  entryCount: number;
  unknownModels: number;
}

export function StatusBar({ isWatching, fileCount, lastUpdate, error, mode, entryCount, unknownModels }: StatusBarProps) {
  if (error) {
    return (
      <Box borderStyle="single" borderColor={colors.critical} paddingX={1}>
        <Text color={colors.critical}>✗ {error}</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={2}>
      <Text inverse={true} color={mode === 'api' ? colors.cost : colors.tokens}>
        {` ${mode.toUpperCase()} `}
      </Text>
      <Text color={isWatching ? colors.success : colors.textMuted}>
        {isWatching ? '● Watching' : '○ Idle'}
      </Text>
      <Text dimColor>
        {fileCount} file{fileCount !== 1 ? 's' : ''}
      </Text>
      <Text dimColor>
        {entryCount} entries
      </Text>
      {unknownModels > 0 && (
        <Text color={colors.warning}>
          {unknownModels} unknown model{unknownModels !== 1 ? 's' : ''}
        </Text>
      )}
      {lastUpdate && (
        <Text dimColor>
          Updated {formatTimeAgo(lastUpdate)}
        </Text>
      )}
      <Spacer />
      <Text dimColor>
        Press q to quit
      </Text>
    </Box>
  );
}

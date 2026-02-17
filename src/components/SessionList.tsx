import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { formatCost, formatTokens, formatTimeAgo, truncate, abbreviateModel } from '../utils/format.js';
import type { SessionSummary } from '../core/types.js';

interface SessionListProps {
  sessions: SessionSummary[];
  maxItems?: number;
  mode: 'api' | 'sub';
}

export function SessionList({ sessions, maxItems = 5, mode }: SessionListProps) {
  const displayed = sessions.slice(0, maxItems);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={colors.border} paddingX={1}>
      <Text bold color={colors.info}>
        {'📋 Active Sessions'}
      </Text>
      {displayed.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>No sessions found</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {displayed.map((s) => (
            <Box key={s.sessionId}>
              <Text color={colors.text}>{truncate(s.projectPath, 16)}</Text>
              <Text dimColor> #{s.sessionId.slice(0, 8)}</Text>
              <Spacer />
              <Text dimColor>{abbreviateModel(s.model)} </Text>
              {mode === 'api' ? (
                <Text color={colors.cost}>{formatCost(s.totalCost)}</Text>
              ) : (
                <Text color={colors.tokens}>{formatTokens(s.totalTokens)}</Text>
              )}
              <Text dimColor>  {s.entryCount}c  {formatTimeAgo(s.lastActivity)}</Text>
            </Box>
          ))}
          {sessions.length > maxItems && (
            <Text dimColor>+{sessions.length - maxItems} more</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

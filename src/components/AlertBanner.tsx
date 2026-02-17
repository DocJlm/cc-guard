import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../utils/colors.js';
import type { BudgetAlert } from '../core/types.js';

interface AlertBannerProps {
  alert: BudgetAlert;
}

export function AlertBanner({ alert }: AlertBannerProps) {
  if (alert.level === 'none') return null;

  const isCritical = alert.level === 'critical';
  const borderColor = isCritical ? colors.critical : colors.warning;
  const icon = isCritical ? '🚨' : '⚠️';

  return (
    <Box
      borderStyle="double"
      borderColor={borderColor}
      paddingX={1}
      justifyContent="center"
      marginTop={1}
    >
      <Text bold color={borderColor}>
        {icon} {alert.message} {icon}
      </Text>
    </Box>
  );
}

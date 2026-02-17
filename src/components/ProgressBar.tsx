import React from 'react';
import { Box, Text } from 'ink';
import { getPercentColor } from '../utils/colors.js';

interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  value: number;
  /** Width in characters */
  width?: number;
  /** Label to show on the left */
  label?: string;
  /** Show percentage on the right */
  showPercent?: boolean;
  /** Custom color (overrides auto color). When set, disables multi-color. */
  color?: string;
}

// Thresholds for multi-color progress bar
const GREEN_THRESHOLD = 0.6;
const AMBER_THRESHOLD = 0.8;
const COLOR_GREEN = '#4ADE80';
const COLOR_AMBER = '#F59E0B';
const COLOR_RED = '#F87171';

export function ProgressBar({
  value,
  width = 30,
  label,
  showPercent = true,
  color,
}: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const pct = Math.round(clamped * 100);
  const filled = Math.round(clamped * width);
  const empty = width - filled;

  const emptyStr = '░'.repeat(empty);

  if (color) {
    // Single color mode
    const filledStr = '█'.repeat(filled);
    return (
      <Box>
        {label && <Text dimColor>{label} </Text>}
        <Text color={color}>{filledStr}</Text>
        <Text dimColor>{emptyStr}</Text>
        {showPercent && <Text color={color}> {pct}%</Text>}
      </Box>
    );
  }

  // Multi-color mode: green → amber → red segments
  const greenEnd = Math.round(GREEN_THRESHOLD * width);
  const amberEnd = Math.round(AMBER_THRESHOLD * width);

  const greenChars = Math.min(filled, greenEnd);
  const amberChars = Math.max(0, Math.min(filled, amberEnd) - greenEnd);
  const redChars = Math.max(0, filled - amberEnd);

  const pctColor = getPercentColor(pct);

  return (
    <Box>
      {label && <Text dimColor>{label} </Text>}
      {greenChars > 0 && <Text color={COLOR_GREEN}>{'█'.repeat(greenChars)}</Text>}
      {amberChars > 0 && <Text color={COLOR_AMBER}>{'█'.repeat(amberChars)}</Text>}
      {redChars > 0 && <Text color={COLOR_RED}>{'█'.repeat(redChars)}</Text>}
      <Text dimColor>{emptyStr}</Text>
      {showPercent && <Text color={pctColor}> {pct}%</Text>}
    </Box>
  );
}

import React from 'react';
import { Box, Text } from 'ink';

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

// Per-char color based on normalized value
const COLOR_LOW = '#4ADE80';    // green
const COLOR_MID = '#F59E0B';    // amber
const COLOR_HIGH = '#F87171';   // red

function getSparkColor(normalized: number): string {
  if (normalized >= 0.75) return COLOR_HIGH;
  if (normalized >= 0.45) return COLOR_MID;
  return COLOR_LOW;
}

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color }: SparklineProps) {
  if (data.length === 0) {
    return <Text dimColor>No data</Text>;
  }

  const max = Math.max(...data, 0.001);

  const chars = data.map(val => {
    const normalized = val / max;
    const index = Math.min(
      Math.floor(normalized * (SPARK_CHARS.length - 1)),
      SPARK_CHARS.length - 1
    );
    return {
      char: SPARK_CHARS[Math.max(0, index)],
      normalized,
    };
  });

  if (color) {
    return <Text color={color}>{chars.map(c => c.char).join('')}</Text>;
  }

  return (
    <Box>
      {chars.map((c, i) => (
        <Text key={i} color={getSparkColor(c.normalized)}>{c.char}</Text>
      ))}
    </Box>
  );
}

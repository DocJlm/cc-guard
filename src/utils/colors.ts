/** Color theme constants for the terminal UI */
export const colors = {
  // Primary
  primary: '#7C6BFF',       // Claude purple
  primaryDim: '#5A4DBF',

  // Status
  success: '#4ADE80',       // Green
  warning: '#FACC15',       // Yellow
  critical: '#F87171',      // Red
  info: '#60A5FA',          // Blue

  // Neutral
  text: '#E2E8F0',          // Light gray
  textDim: '#94A3B8',       // Medium gray
  textMuted: '#64748B',     // Darker gray
  border: '#334155',        // Border color
  bg: '#0F172A',            // Dark background

  // Semantic
  cost: '#F59E0B',          // Amber for costs
  tokens: '#818CF8',        // Indigo for tokens
  rate: '#34D399',          // Emerald for rates
  time: '#38BDF8',          // Sky for time
} as const;

/** Get color for alert level */
export function getAlertColor(level: 'none' | 'warning' | 'critical'): string {
  switch (level) {
    case 'warning': return colors.warning;
    case 'critical': return colors.critical;
    default: return colors.success;
  }
}

/** Get color for a percentage (green → yellow → red) */
export function getPercentColor(pct: number): string {
  if (pct >= 95) return colors.critical;
  if (pct >= 80) return colors.warning;
  if (pct >= 60) return colors.cost;
  return colors.success;
}

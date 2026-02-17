import React from 'react';
import { Box, Text, Spacer } from 'ink';
import { colors } from '../utils/colors.js';
import { abbreviateModel } from '../utils/format.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { CostPanel } from './CostPanel.js';
import { BurnRatePanel } from './BurnRatePanel.js';
import { BlockTimeline } from './BlockTimeline.js';
import { TokenBreakdown } from './TokenBreakdown.js';
import { AlertBanner } from './AlertBanner.js';
import { SessionList } from './SessionList.js';
import { StatusBar } from './StatusBar.js';
import type { BillingBlock, BurnRate, TokenBurnRate, BudgetAlert, ModelBreakdown, SessionSummary, Config } from '../core/types.js';

interface DashboardProps {
  currentBlock: BillingBlock | null;
  costRate: BurnRate;
  tokenRate: TokenBurnRate;
  alert: BudgetAlert;
  models: ModelBreakdown[];
  sessions: SessionSummary[];
  totalCostAllTime: number;
  totalTokensAllTime: number;
  progress: number;
  remainingMs: number;
  isWatching: boolean;
  fileCount: number;
  lastUpdate: Date | null;
  error: string | null;
  mode: 'api' | 'sub';
  config: Config;
}

export function Dashboard({
  currentBlock,
  costRate,
  tokenRate,
  alert,
  models,
  sessions,
  totalCostAllTime,
  totalTokensAllTime,
  progress,
  remainingMs,
  isWatching,
  fileCount,
  lastUpdate,
  error,
  mode,
  config,
}: DashboardProps) {
  const { columns } = useTerminalSize();
  const isWide = columns >= 80;

  // Find the primary model from current block
  const primaryModel = models.length > 0 ? abbreviateModel(models[0].model) : '';

  // Calculate half-width for equal panel sizing (minus gap and padding)
  const halfWidth = isWide ? Math.floor((columns - 4) / 2) : undefined;

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Box borderStyle="bold" borderColor={colors.primary} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false} paddingX={1}>
        <Text bold color={colors.primary}>
          {'cc-guard'}
        </Text>
        <Text dimColor> v0.2.0</Text>
        <Spacer />
        <Text inverse={true} color={mode === 'api' ? colors.cost : colors.tokens}>
          {` ${mode.toUpperCase()} `}
        </Text>
        {primaryModel && (
          <Text dimColor> {primaryModel}</Text>
        )}
        <Text dimColor> </Text>
        <Text color={isWatching ? colors.success : colors.textMuted}>
          {isWatching ? '● Watching' : '○ Idle'}
        </Text>
      </Box>

      {/* Alert Banner — hidden in sub mode */}
      {mode === 'api' && <AlertBanner alert={alert} />}

      {/* Top Row: Cost + Burn Rate */}
      <Box gap={1} marginTop={1} flexDirection={isWide ? 'row' : 'column'}>
        <Box width={halfWidth}>
          <CostPanel
            currentBlock={currentBlock}
            totalCostAllTime={totalCostAllTime}
            totalTokensAllTime={totalTokensAllTime}
            alert={alert}
            mode={mode}
          />
        </Box>
        {(config.panels?.burnRate !== false) && (
          <Box flexGrow={1}>
            <BurnRatePanel
              costRate={costRate}
              tokenRate={tokenRate}
              mode={mode}
              showSparkline={config.panels?.sparkline !== false}
            />
          </Box>
        )}
      </Box>

      {/* Middle: Block Timeline */}
      <Box marginTop={1}>
        <Box flexGrow={1}>
          <BlockTimeline
            currentBlock={currentBlock}
            progress={progress}
            remainingMs={remainingMs}
            columns={columns}
          />
        </Box>
      </Box>

      {/* Bottom Row: Tokens + Sessions */}
      <Box gap={1} marginTop={1} flexDirection={isWide ? 'row' : 'column'}>
        {(config.panels?.tokenBreakdown !== false) && (
          <Box width={halfWidth}>
            <TokenBreakdown models={models} mode={mode} />
          </Box>
        )}
        {(config.panels?.sessionList !== false) && (
          <Box flexGrow={1}>
            <SessionList sessions={sessions} mode={mode} />
          </Box>
        )}
      </Box>

      {/* Status Bar */}
      <Box marginTop={1}>
        <StatusBar
          isWatching={isWatching}
          fileCount={fileCount}
          lastUpdate={lastUpdate}
          error={error}
          mode={mode}
          entryCount={currentBlock?.entries.length ?? 0}
          unknownModels={models.filter(m => !m.hasPricing).length}
        />
      </Box>
    </Box>
  );
}

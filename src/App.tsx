import React, { useState, useEffect } from 'react';
import { useInput, useStdin } from 'ink';
import type { Config } from './core/types.js';
import { getTotalCost, getTotalTokens, getModelBreakdown, getSessionSummaries } from './core/cost-calculator.js';
import { useLogWatcher } from './hooks/useLogWatcher.js';
import { useBillingBlock } from './hooks/useBillingBlock.js';
import { useBurnRate } from './hooks/useBurnRate.js';
import { useBudgetAlert } from './hooks/useBudgetAlert.js';
import { useConfig } from './hooks/useConfig.js';
import { Dashboard } from './components/Dashboard.js';

interface AppProps {
  configOverrides?: Partial<Config>;
  onExit?: () => void;
}

function KeyboardHandler({ onExit }: { onExit?: () => void }) {
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      onExit?.();
    }
  });
  return null;
}

export function App({ configOverrides, onExit }: AppProps) {
  const config = useConfig(configOverrides);
  const [now, setNow] = useState(new Date());
  const { isRawModeSupported } = useStdin();

  // Refresh "now" every second for live updates
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), config.refreshInterval ?? 1000);
    return () => clearInterval(interval);
  }, [config.refreshInterval]);

  // Watch log files
  const { entries, fileCount, isWatching, error, lastUpdate } = useLogWatcher(config.logDir);

  // Compute billing block
  const { currentBlock, progress, remainingMs } = useBillingBlock(entries, now);

  // Compute burn rates (both cost and token)
  const { costRate, tokenRate } = useBurnRate(currentBlock, now);

  // Compute budget alert
  const blockCost = currentBlock?.totalCost ?? 0;
  const alert = useBudgetAlert(blockCost, config);

  // Compute breakdowns
  const blockEntries = currentBlock?.entries ?? [];
  const models = getModelBreakdown(blockEntries, config.customPricing);
  const sessions = getSessionSummaries(blockEntries);
  const totalCostAllTime = getTotalCost(entries);
  const totalTokensAllTime = getTotalTokens(entries);

  return (
    <>
      {/* Only enable keyboard input when raw mode is available (real TTY) */}
      {isRawModeSupported && <KeyboardHandler onExit={onExit} />}
      <Dashboard
        currentBlock={currentBlock}
        costRate={costRate}
        tokenRate={tokenRate}
        alert={alert}
        models={models}
        sessions={sessions}
        totalCostAllTime={totalCostAllTime}
        totalTokensAllTime={totalTokensAllTime}
        progress={progress}
        remainingMs={remainingMs}
        isWatching={isWatching}
        fileCount={fileCount}
        lastUpdate={lastUpdate}
        error={error}
        mode={config.mode}
        config={config}
      />
    </>
  );
}

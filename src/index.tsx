import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './App.js';
import type { Config } from './core/types.js';

const program = new Command();

program
  .name('cc-guard')
  .description('Real-time cost guard for Claude Code')
  .version('0.2.0')
  .option('-b, --budget <amount>', 'Budget per 5-hour block in USD', parseFloat)
  .option('--no-alert', 'Disable budget alerts')
  .option('-d, --log-dir <path>', 'Custom Claude Code logs directory')
  .option('--warning <percent>', 'Warning threshold percentage', parseFloat)
  .option('--critical <percent>', 'Critical threshold percentage', parseFloat)
  .option('-m, --mode <mode>', 'Billing mode: api (pay-per-token) or sub (subscription)')
  .action((opts) => {
    const configOverrides: Partial<Config> = {};

    if (opts.budget != null) configOverrides.budgetPerBlock = opts.budget;
    if (opts.alert === false) configOverrides.alertsEnabled = false;
    if (opts.logDir) configOverrides.logDir = opts.logDir;
    if (opts.warning != null) configOverrides.warningThreshold = opts.warning;
    if (opts.critical != null) configOverrides.criticalThreshold = opts.critical;
    if (opts.mode === 'api' || opts.mode === 'sub') configOverrides.mode = opts.mode;

    const { unmount, waitUntilExit } = render(
      <App configOverrides={configOverrides} onExit={() => unmount()} />,
      {
        // Allow running without a TTY (e.g., piped stdin)
        stdin: process.stdin,
        stdout: process.stdout,
      }
    );

    waitUntilExit().then(() => {
      process.exit(0);
    });
  });

program.parse();

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Config } from '../core/types.js';
import { defaultConfig } from './defaults.js';

const CONFIG_FILENAME = '.cc-guard.json';

/**
 * Load configuration from ~/.cc-guard.json, merging with defaults.
 */
export function loadConfig(overrides?: Partial<Config>): Config {
  const configPath = join(homedir(), CONFIG_FILENAME);
  let fileConfig: Partial<Config> = {};

  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);
    } catch {
      // Invalid config file, use defaults
    }
  }

  return {
    ...defaultConfig,
    ...fileConfig,
    ...overrides,
  };
}

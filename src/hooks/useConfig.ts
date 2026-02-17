import { useMemo } from 'react';
import type { Config } from '../core/types.js';
import { loadConfig } from '../config/loader.js';

/**
 * Hook that loads and merges configuration.
 */
export function useConfig(overrides?: Partial<Config>): Config {
  return useMemo(() => loadConfig(overrides), [overrides]);
}

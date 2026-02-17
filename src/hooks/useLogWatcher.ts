import { useState, useEffect, useRef, useCallback } from 'react';
import { watch } from 'chokidar';
import { readFileSync, statSync } from 'fs';
import type { UsageEntry } from '../core/types.js';
import { parseLine } from '../core/jsonl-parser.js';
import { getWatchPattern, discoverLogFiles, logsDirectoryExists } from '../core/log-discovery.js';
import { getClaudeLogsDir } from '../utils/platform.js';

interface LogWatcherState {
  entries: UsageEntry[];
  fileCount: number;
  isWatching: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

/**
 * Hook that watches Claude Code JSONL logs and provides parsed, deduplicated entries.
 * Deduplicates by requestId across all files (streaming chunks share requestId).
 */
export function useLogWatcher(customLogDir?: string): LogWatcherState {
  const [state, setState] = useState<LogWatcherState>({
    entries: [],
    fileCount: 0,
    isWatching: false,
    error: null,
    lastUpdate: null,
  });

  // Track file read offsets for incremental reading
  const fileOffsets = useRef<Map<string, number>>(new Map());
  // Global dedup map: requestId → UsageEntry (latest wins)
  const entryMap = useRef<Map<string, UsageEntry>>(new Map());
  // Entries without requestId
  const noIdEntries = useRef<UsageEntry[]>([]);

  const rebuildEntries = useCallback(() => {
    const all = [...entryMap.current.values(), ...noIdEntries.current];
    setState(prev => ({
      ...prev,
      entries: all,
      lastUpdate: new Date(),
    }));
  }, []);

  const processLine = useCallback((line: string, filePath: string): boolean => {
    const entry = parseLine(line, filePath);
    if (!entry) return false;

    if (entry.requestId) {
      entryMap.current.set(entry.requestId, entry);
    } else {
      noIdEntries.current.push(entry);
    }
    return true;
  }, []);

  /**
   * Read new lines from a file starting at the stored offset.
   */
  const readNewLines = useCallback((filePath: string) => {
    try {
      const stat = statSync(filePath);
      const currentOffset = fileOffsets.current.get(filePath) ?? 0;

      if (stat.size <= currentOffset) return;

      const content = readFileSync(filePath, 'utf-8');
      const newContent = content.slice(currentOffset);
      fileOffsets.current.set(filePath, stat.size);

      const lines = newContent.split('\n');
      let added = false;

      for (const line of lines) {
        if (processLine(line, filePath)) {
          added = true;
        }
      }

      if (added) rebuildEntries();
    } catch {
      // File might have been deleted or become unreadable
    }
  }, [processLine, rebuildEntries]);

  useEffect(() => {
    const logDir = customLogDir ?? getClaudeLogsDir();

    if (!logsDirectoryExists(customLogDir)) {
      setState(prev => ({
        ...prev,
        error: `Claude Code logs directory not found: ${logDir}`,
        isWatching: false,
      }));
      return;
    }

    // Initial scan: read all existing files
    const existingFiles = discoverLogFiles(customLogDir);

    for (const logFile of existingFiles) {
      try {
        const content = readFileSync(logFile.path, 'utf-8');
        fileOffsets.current.set(logFile.path, content.length);
        const lines = content.split('\n');
        for (const line of lines) {
          processLine(line, logFile.path);
        }
      } catch {
        // Skip unreadable files
      }
    }

    const allEntries = [...entryMap.current.values(), ...noIdEntries.current];

    setState({
      entries: allEntries,
      fileCount: existingFiles.length,
      isWatching: true,
      error: null,
      lastUpdate: allEntries.length > 0 ? new Date() : null,
    });

    // Start watching for changes
    const watchPattern = getWatchPattern(customLogDir);
    const watcher = watch(watchPattern, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    watcher.on('change', (filePath: string) => {
      readNewLines(filePath);
    });

    watcher.on('add', (filePath: string) => {
      setState(prev => ({ ...prev, fileCount: prev.fileCount + 1 }));
      readNewLines(filePath);
    });

    watcher.on('error', (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      setState(prev => ({
        ...prev,
        error: `File watcher error: ${msg}`,
      }));
    });

    return () => {
      watcher.close();
    };
  }, [customLogDir, readNewLines, processLine]);

  return state;
}

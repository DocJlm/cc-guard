import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { getClaudeLogsDir } from '../utils/platform.js';

export interface LogFile {
  path: string;
  projectDir: string;
  sessionId: string;
}

/**
 * Discover all JSONL log files in the Claude Code logs directory.
 */
export function discoverLogFiles(customLogDir?: string): LogFile[] {
  const baseDir = customLogDir ?? getClaudeLogsDir();

  if (!existsSync(baseDir)) {
    return [];
  }

  const logFiles: LogFile[] = [];

  try {
    const projectDirs = readdirSync(baseDir);

    for (const projectDir of projectDirs) {
      const projectPath = join(baseDir, projectDir);
      try {
        const stat = statSync(projectPath);
        if (!stat.isDirectory()) continue;

        const files = readdirSync(projectPath);
        for (const file of files) {
          if (file.endsWith('.jsonl')) {
            logFiles.push({
              path: join(projectPath, file),
              projectDir,
              sessionId: file.replace(/\.jsonl$/, ''),
            });
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
  } catch {
    // Base directory not readable
  }

  return logFiles;
}

/**
 * Get the glob pattern for watching JSONL files.
 */
export function getWatchPattern(customLogDir?: string): string {
  const baseDir = customLogDir ?? getClaudeLogsDir();
  // Use forward slashes for chokidar compatibility
  return join(baseDir, '**', '*.jsonl').replace(/\\/g, '/');
}

/**
 * Check if the Claude Code logs directory exists.
 */
export function logsDirectoryExists(customLogDir?: string): boolean {
  const baseDir = customLogDir ?? getClaudeLogsDir();
  return existsSync(baseDir);
}

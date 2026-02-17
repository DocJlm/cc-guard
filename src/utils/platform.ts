import { homedir } from 'os';
import { join } from 'path';

/**
 * Get the Claude Code logs directory.
 * Claude Code stores JSONL logs at: ~/.claude/projects/{encoded-path}/{sessionId}.jsonl
 */
export function getClaudeLogsDir(): string {
  return join(homedir(), '.claude', 'projects');
}

/**
 * Decode a project path from the directory name used by Claude Code.
 * Claude Code encodes project paths by replacing path separators with dashes.
 */
export function decodeProjectPath(encodedName: string): string {
  // Claude Code uses the format: /path/to/project → -path-to-project (Unix)
  // or D:\path\to\project → D--path-to-project (Windows)
  return encodedName;
}

/**
 * Extract session ID from a JSONL filename.
 */
export function extractSessionId(filename: string): string {
  return filename.replace(/\.jsonl$/, '');
}

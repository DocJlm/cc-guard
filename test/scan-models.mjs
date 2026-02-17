import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const baseDir = join(homedir(), '.claude/projects');
const models = new Map();
const dirs = readdirSync(baseDir);
for (const dir of dirs) {
  const dirPath = join(baseDir, dir);
  try {
    if (!statSync(dirPath).isDirectory()) continue;
    const files = readdirSync(dirPath).filter(f => f.endsWith('.jsonl'));
    for (const file of files.slice(0, 3)) {
      const content = readFileSync(join(dirPath, file), 'utf8');
      for (const line of content.split('\n').slice(0, 200)) {
        try {
          const obj = JSON.parse(line);
          if (obj.type === 'assistant' && obj.message?.model) {
            models.set(obj.message.model, (models.get(obj.message.model) || 0) + 1);
          }
        } catch {}
      }
    }
  } catch {}
}
for (const [model, count] of [...models.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${model}: ${count} entries`);
}

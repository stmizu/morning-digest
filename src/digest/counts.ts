import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './read-night.js';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Valid log lines per status; bad lines are skipped.
export function countLines(text: string): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line) counts[line.status]++;
  }
  return counts;
}

// null when the night has no readable file (renders as "—").
export function readCounts(runsDir: string, night: string): NightCounts | null {
  try {
    return countLines(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'));
  } catch {
    return null;
  }
}

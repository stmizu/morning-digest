import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestNight, DigestRow, ReadNight, RunStatus } from './types.js';

export type Line = { at: string; job: string; status: RunStatus; owner: string | null; error: string | null };

const STATUSES: readonly string[] = ['ok', 'retry', 'fail'];

// Parse at the edge: anything that is not a well-formed line is undefined.
export function parseLine(text: string): Line | undefined {
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof v !== 'object' || v === null) return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || Number.isNaN(Date.parse(o.at))) return undefined;
  if (typeof o.job !== 'string' || o.job === '') return undefined;
  if (typeof o.status !== 'string' || !STATUSES.includes(o.status)) return undefined;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: typeof o.owner === 'string' ? o.owner : null,
    error: typeof o.error === 'string' ? o.error : null,
  };
}

export const readNight: ReadNight = (runsDir, night) => {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const byJob = new Map<string, Line[]>();
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (!line) {
      badLines++;
      continue;
    }
    byJob.set(line.job, [...(byJob.get(line.job) ?? []), line]);
  }

  const rows: DigestRow[] = [...byJob.entries()]
    .map(([job, lines]) => {
      const sorted = [...lines].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      const last = sorted[sorted.length - 1]!;
      const lastWithError = [...sorted].reverse().find((l) => l.error !== null);
      return {
        job,
        owner: [...sorted].reverse().find((l) => l.owner !== null)?.owner ?? null,
        runs: sorted.length,
        retries: sorted.filter((l) => l.status === 'retry').length,
        lastStatus: last.status,
        lastError: lastWithError?.error ?? null,
        firstAt: sorted[0]!.at,
        lastAt: last.at,
      };
    })
    .sort((a, b) => a.job.localeCompare(b.job));

  const result: DigestNight = { night, rows, badLines };
  return result;
};

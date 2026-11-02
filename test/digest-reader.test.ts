import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

describe('readNight', () => {
  it('reads 2026-10-28: 5 jobs, 1 bad line', () => {
    const n = readNight('runs', '2026-10-28')!;
    expect(n.rows.map((r) => r.job)).toEqual(['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs']);
    expect(n.badLines).toBe(1);
    const fx = n.rows.find((r) => r.job === 'fixtures/refresh')!;
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(n.rows.find((r) => r.job === 'digest/render')!.owner).toBeNull();
    expect(n.rows.find((r) => r.job === 'notes/backup')!.lastStatus).toBe('fail');
  });

  it('keeps the offset from the log', () => {
    const r = readNight('runs', '2026-10-28')!.rows.find((x) => x.job === 'rig/rotate-logs')!;
    expect(r.firstAt).toBe('2026-10-28T23:00:02+01:00');
  });

  it('returns null when the night has no file', () => {
    expect(readNight('runs', '2000-01-01')).toBeNull();
  });

  it('empty file gives no rows; garbage lines are counted, not thrown', () => {
    const dir = mkdtempSync(join(tmpdir(), 'runs-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    expect(readNight(dir, '2026-01-01')).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
    writeFileSync(join(dir, '2026-01-02.jsonl'), 'nope\n{"at":"x"}\n[1]\n');
    expect(readNight(dir, '2026-01-02')!.badLines).toBe(3);
  });
});

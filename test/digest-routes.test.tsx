import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

const good = [
  { at: '2026-10-28T01:00:00+01:00', job: 'backup', status: 'ok', owner: 'ania' },
  { at: '2026-10-28T02:00:00+01:00', job: 'alpha-sync', status: 'fail', owner: 'bob', error: 'timeout' },
]
  .map((l) => JSON.stringify(l))
  .join('\n');

type Json = { night: string; rows: { job: string }[]; badLines: number };

let runsDir: string;
const app = () => createApp({ ...base, runsDir });
const write = (night: string, text: string) => writeFileSync(join(runsDir, `${night}.jsonl`), text);

beforeEach(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  mkdirSync(runsDir, { recursive: true });
});
afterEach(() => rmSync(runsDir, { recursive: true, force: true }));

describe('GET /digest/:night', () => {
  it('renders the table for an existing night', async () => {
    write('2026-10-28', good + '\n');
    const res = await app().request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('<table');
    expect(html).toContain('backup');
    expect(html).toContain('alpha-sync');
  });

  it('answers 404 for a night with no file', async () => {
    const res = await app().request('/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty file', async () => {
    write('2026-10-28', '');
    const res = await app().request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders the good rows when a line is bad', async () => {
    write('2026-10-28', good + '\nnot json at all\n');
    const res = await app().request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('backup');
    expect(html).toContain('alpha-sync');
  });
});

describe('GET /api/digest/:night', () => {
  it('returns night, rows and badLines in the same order as the page', async () => {
    write('2026-10-28', good + '\n');
    const res = await app().request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.night).toBe('2026-10-28');
    expect(body.badLines).toBe(0);
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual(['alpha-sync', 'backup']);
    const html = await (await app().request('/digest/2026-10-28')).text();
    expect(html.indexOf(jobs[0]!)).toBeLessThan(html.indexOf(jobs[1]!));
  });

  it('answers 404 for a night with no file', async () => {
    const res = await app().request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('gives no rows for an empty file', async () => {
    write('2026-10-28', '');
    const res = await app().request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(((await res.json()) as Json).rows).toEqual([]);
  });

  it('counts a bad line and returns the rest', async () => {
    write('2026-10-28', good + '\nnot json at all\n');
    const res = await app().request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Json;
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['alpha-sync', 'backup']);
  });
});

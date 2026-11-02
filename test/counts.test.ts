import { describe, expect, it } from 'vitest';
import { countLines } from '../src/digest/counts.js';

describe('countLines', () => {
  it('counts valid lines by status and skips bad ones', () => {
    const l = (status: string) => JSON.stringify({ at: '2026-10-28T01:00:00+01:00', job: 'a', status });
    expect(countLines([l('ok'), l('ok'), l('retry'), l('fail'), 'garbage', ''].join('\n'))).toEqual({ ok: 2, retry: 1, fail: 1 });
  });
});

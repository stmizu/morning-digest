import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/read-night.js';
import type { RigConfig } from '../src/config.js';

const config: RigConfig = { adapter: 'test', installed: '', beatEverySeconds: 60, runsDir: 'runs' };

describe('GET /api/digest/:night', () => {
  it('returns the reader rows in the same order', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(JSON.parse(JSON.stringify(readNight('runs', '2026-10-28'))));
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs']);
  });

  it('404s for a missing night and a malformed one', async () => {
    const app = createApp(config);
    for (const n of ['2026-01-01', '..%2Frig', 'abc']) {
      const res = await app.request(`/api/digest/${n}`);
      expect(res.status).toBe(404);
      expect(await res.json()).toHaveProperty('error');
    }
  });
});

import type { DigestNight } from '../digest/types.js';

const dash = (v: string | null) => (v === null ? '—' : v);

export function DigestPage({ digest }: { digest: DigestNight }) {
  return (
    <>
      <h1>digest {digest.night}</h1>
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((r) => {
              const flagged = r.retries >= 3 || r.lastStatus === 'fail';
              return (
                <tr class={flagged ? 'warn' : undefined}>
                  <td>{flagged ? `! ${r.job}` : r.job}</td>
                  <td>{dash(r.owner)}</td>
                  <td>{r.runs}</td>
                  <td>{r.retries >= 3 ? `${r.retries} (many)` : r.retries}</td>
                  <td>{r.lastStatus === 'fail' ? 'fail (!)' : r.lastStatus}</td>
                  <td>{dash(r.lastError)}</td>
                  <td>{r.firstAt}</td>
                  <td>{r.lastAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

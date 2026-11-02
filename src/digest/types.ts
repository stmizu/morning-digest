export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job for one night. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as "—"
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type DigestNight = {
  night: string;
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse; counted, never thrown
};

// Returns null when there is no file for that night (the route answers 404).
export type ReadNight = (runsDir: string, night: string) => DigestNight | null;

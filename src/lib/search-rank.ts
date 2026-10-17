const WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export type SearchEvent = { id: string; at: number };

const idOk = /^[A-Za-z0-9-]{1,40}$/;

export function rankSearches(events: SearchEvent[], now = Date.now(), limit = 8) {
  const cutoff = now - WINDOW_MS;
  const counts = new Map<string, { n: number; at: number }>();
  for (const event of events) {
    if (!event || typeof event.id !== "string" || typeof event.at !== "number") continue;
    if (!idOk.test(event.id) || event.at < cutoff) continue;
    const row = counts.get(event.id) ?? { n: 0, at: 0 };
    row.n += 1;
    row.at = Math.max(row.at, event.at);
    counts.set(event.id, row);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n || b[1].at - a[1].at || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id]) => id);
}

import "server-only";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

/**
 * Per-instance sliding-window limiter. Adequate for a single Node server; on multi-instance
 * or serverless hosting, swap for a shared store or platform firewall rules.
 */
export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  const limited = recent.length >= MAX_REQUESTS;
  if (!limited) recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return limited;
}

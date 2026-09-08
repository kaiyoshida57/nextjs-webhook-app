import { headers } from 'next/headers';

const WINDOW_MS = 10 * 60 * 1000;
export const LOGIN_FAIL_LIMIT = 5;
export const POST_LIMIT = 20;

const hits = new Map<string, number[]>();

function prune(key: string, now: number): number[] {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(key, recent);
  return recent;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return h.get('x-real-ip')?.trim() || 'unknown';
}

export function isLimited(key: string, limit: number): boolean {
  return prune(key, Date.now()).length >= limit;
}

export function hit(key: string): void {
  const now = Date.now();
  const recent = prune(key, now);
  recent.push(now);
  hits.set(key, recent);
}

export function consume(key: string, limit: number): boolean {
  if (isLimited(key, limit)) {
    return false;
  }
  hit(key);
  return true;
}

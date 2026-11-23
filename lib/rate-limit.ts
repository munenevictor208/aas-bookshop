import { getDb } from "./db.ts";

export const RATE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;
export const REQUEST_MAX_ATTEMPTS = 15;
export const UPLOAD_MAX_ATTEMPTS = 20;

async function pruneExpired(now: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM login_attempts WHERE reset_at <= ?", [now]);
}

export async function getAttemptCount(key: string): Promise<number> {
  const now = Date.now();
  const db = await getDb();
  await pruneExpired(now);
  const row = await db.queryOne<{ count: number | bigint | string }>(
    "SELECT count FROM login_attempts WHERE key = ?",
    [key]
  );
  return Number(row?.count ?? 0);
}

export async function recordAttempt(key: string, max: number): Promise<boolean> {
  const now = Date.now();
  const db = await getDb();
  await pruneExpired(now);
  const row = await db.queryOne<{ count: number | bigint | string }>(
    "SELECT count, reset_at FROM login_attempts WHERE key = ?",
    [key]
  );

  if (!row) {
    await db.execute("INSERT INTO login_attempts (key, count, reset_at) VALUES (?, 1, ?)", [
      key,
      now + RATE_WINDOW_MS,
    ]);
    return true;
  }

  const count = Number(row.count) + 1;
  await db.execute("UPDATE login_attempts SET count = ? WHERE key = ?", [count, key]);
  return count <= max;
}

export async function clearAttempts(key: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM login_attempts WHERE key = ?", [key]);
}

export async function checkUploadRateLimit(ip: string): Promise<boolean> {
  return recordAttempt(`upload:${ip}`, UPLOAD_MAX_ATTEMPTS);
}

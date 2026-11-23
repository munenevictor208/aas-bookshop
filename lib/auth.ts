import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clearAttempts,
  getAttemptCount,
  LOGIN_MAX_ATTEMPTS,
  recordAttempt,
  REQUEST_MAX_ATTEMPTS,
} from "./rate-limit.ts";
import {
  createSessionToken,
  getAuthConfig,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  verifySessionToken,
} from "./session.ts";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

function loginKey(email: string): string {
  return `login:${email.trim().toLowerCase()}`;
}

export async function checkLoginRateLimit(email: string): Promise<number> {
  return getAttemptCount(loginKey(email));
}

export async function recordFailedLogin(email: string): Promise<void> {
  await recordAttempt(loginKey(email), LOGIN_MAX_ATTEMPTS);
}

export async function clearLoginFailures(email: string): Promise<void> {
  await clearAttempts(loginKey(email));
}

export async function getClientIp(): Promise<string> {
  if (process.env.TRUST_PROXY_HEADERS !== "1") return "local";
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

export async function checkIpRateLimit(ip: string): Promise<boolean> {
  return recordAttempt(`request:${ip}`, REQUEST_MAX_ATTEMPTS);
}

export async function isOwnerAuthenticated(): Promise<boolean> {
  const config = getAuthConfig();
  if (!config) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, config.secret) !== null;
}

export async function requireOwner(): Promise<void> {
  if (!(await isOwnerAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function setOwnerSession() {
  const config = getAuthConfig();
  if (!config) throw new Error("Owner login is not configured");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearOwnerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function isConfigurationMissing(): boolean {
  return getAuthConfig() === null;
}
